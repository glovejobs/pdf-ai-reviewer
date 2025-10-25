import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { processDocument } from '../services/processing.service';
import { PROCESSING_LIMITS } from '../config/constants';

export default async function documentRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/documents
   * Upload a new document
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Validate file type
      if (data.mimetype !== 'application/pdf') {
        return reply.code(400).send({ error: 'Only PDF files are supported' });
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Validate file size
      if (buffer.length > PROCESSING_LIMITS.MAX_FILE_SIZE) {
        return reply.code(400).send({
          error: `File size exceeds maximum of ${PROCESSING_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`
        });
      }

      // Create document record
      const document = await fastify.prisma.document.create({
        data: {
          filename: data.filename,
          originalName: data.filename,
          fileSize: buffer.length,
          mimeType: data.mimetype,
          status: 'UPLOADED'
        }
      });

      // Create audit log
      await fastify.prisma.auditLog.create({
        data: {
          documentId: document.id,
          action: 'UPLOAD',
          metadata: {
            filename: data.filename,
            fileSize: buffer.length
          }
        }
      });

      // Return document info immediately
      reply.code(201).send({
        id: document.id,
        filename: document.filename,
        fileSize: document.fileSize,
        status: document.status,
        uploadedAt: document.uploadedAt
      });

      // Start processing asynchronously (don't await)
      processDocument(document.id, buffer, fastify.prisma).catch(error => {
        fastify.log.error(`Processing failed for document ${document.id}:`, error);
      });

    } catch (error) {
      fastify.log.error('Upload error:', error);
      return reply.code(500).send({
        error: 'Failed to upload document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/documents/:id/ingest
   * Manually trigger ingestion (for already uploaded docs)
   */
  fastify.post('/:id/ingest', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const document = await fastify.prisma.document.findUnique({
        where: { id }
      });

      if (!document) {
        return reply.code(404).send({ error: 'Document not found' });
      }

      if (document.status === 'PROCESSING') {
        return reply.code(400).send({ error: 'Document is already being processed' });
      }

      reply.send({ message: 'Processing started', documentId: id });

      // Note: In production, you'd retrieve the file from S3
      // For now, this endpoint is mainly for re-processing
      throw new Error('Ingestion endpoint requires file retrieval from storage');

    } catch (error) {
      fastify.log.error('Ingest error:', error);
      return reply.code(500).send({
        error: 'Failed to start ingestion',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/documents/:id/status
   * Get processing status of a document
   */
  fastify.get('/:id/status', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const document = await fastify.prisma.document.findUnique({
        where: { id },
        include: {
          jobs: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!document) {
        return reply.code(404).send({ error: 'Document not found' });
      }

      // Calculate overall progress
      const jobs = document.jobs;
      const totalProgress = jobs.length > 0
        ? Math.floor(jobs.reduce((sum, job) => sum + job.progress, 0) / jobs.length)
        : 0;

      return reply.send({
        documentId: document.id,
        filename: document.filename,
        status: document.status,
        pageCount: document.pageCount,
        overallProgress: totalProgress,
        jobs: jobs.map(job => ({
          type: job.jobType,
          status: job.status,
          progress: job.progress,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error
        })),
        uploadedAt: document.uploadedAt,
        updatedAt: document.updatedAt
      });

    } catch (error) {
      fastify.log.error('Status error:', error);
      return reply.code(500).send({
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/documents/:id/result
   * Get final analysis results
   */
  fastify.get('/:id/result', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const document = await fastify.prisma.document.findUnique({
        where: { id },
        include: {
          result: true
        }
      });

      if (!document) {
        return reply.code(404).send({ error: 'Document not found' });
      }

      if (!document.result) {
        return reply.code(404).send({
          error: 'Results not available yet',
          status: document.status
        });
      }

      // Create audit log
      await fastify.prisma.auditLog.create({
        data: {
          documentId: document.id,
          action: 'VIEW'
        }
      });

      return reply.send({
        documentId: document.id,
        filename: document.filename,
        pageCount: document.pageCount,
        result: {
          overallRating: document.result.overallRating,
          ratingName: getRatingName(document.result.overallRating),
          scores: {
            violence: document.result.violenceScore,
            sexualContent: document.result.sexualContentScore,
            profanity: document.result.profanityScore,
            hate: document.result.hateScore,
            selfHarm: document.result.selfHarmScore
          },
          confidence: document.result.confidence,
          flaggedTerms: {
            total: document.result.totalFlaggedTerms,
            byCategory: document.result.flaggedTermsByCategory
          },
          summary: document.result.summary,
          rationale: document.result.rationale,
          evidence: document.result.evidenceExcerpts
        },
        analyzedAt: document.result.createdAt
      });

    } catch (error) {
      fastify.log.error('Result error:', error);
      return reply.code(500).send({
        error: 'Failed to get result',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/documents
   * List all documents
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const documents = await fastify.prisma.document.findMany({
        orderBy: { uploadedAt: 'desc' },
        take: 50,
        include: {
          result: {
            select: {
              overallRating: true,
              confidence: true
            }
          }
        }
      });

      return reply.send({
        documents: documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          fileSize: doc.fileSize,
          pageCount: doc.pageCount,
          status: doc.status,
          overallRating: doc.result?.overallRating,
          confidence: doc.result?.confidence,
          uploadedAt: doc.uploadedAt
        }))
      });

    } catch (error) {
      fastify.log.error('List error:', error);
      return reply.code(500).send({
        error: 'Failed to list documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

function getRatingName(rating: number): string {
  const names = [
    'All Ages',
    'Juvenile Advisory',
    'Youth Advisory',
    'Youth Restricted',
    'Adults Only',
    'Deviant Content'
  ];
  return names[rating] || 'Unknown';
}
