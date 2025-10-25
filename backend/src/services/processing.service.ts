import { PrismaClient } from '@prisma/client';
import { extractAndChunk } from './extraction.service';
import { classifyContent } from './classification.service';
import { mapToRubric, aggregateRubrics } from './rubric.service';
import { countTerms, aggregateTermCounts, loadTermListsFromDB } from './term-counter.service';

/**
 * Main processing pipeline for a document
 */
export async function processDocument(
  documentId: string,
  fileBuffer: Buffer,
  prisma: PrismaClient
): Promise<void> {
  try {
    // Update job status
    await updateJobStatus(prisma, documentId, 'TEXT_EXTRACTION', 'RUNNING', 10);

    // Step 1: Extract text and create chunks
    const { text, pageCount, chunks } = await extractAndChunk(fileBuffer);

    // Update document with page count
    await prisma.document.update({
      where: { id: documentId },
      data: {
        pageCount,
        status: 'PROCESSING'
      }
    });

    // Save chunks to database
    await Promise.all(
      chunks.map(chunk =>
        prisma.chunk.create({
          data: {
            documentId,
            chunkIndex: chunk.index,
            text: chunk.text,
            pageStart: chunk.pageStart,
            pageEnd: chunk.pageEnd,
            tokenCount: chunk.tokenCount
          }
        })
      )
    );

    await updateJobStatus(prisma, documentId, 'TEXT_EXTRACTION', 'COMPLETED', 30);

    // Step 2: Classify each chunk
    await updateJobStatus(prisma, documentId, 'CLASSIFICATION', 'RUNNING', 40);

    const termLists = await loadTermListsFromDB(prisma);
    const chunkRecords = await prisma.chunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' }
    });

    for (let i = 0; i < chunkRecords.length; i++) {
      const chunk = chunkRecords[i];

      // Classify with OpenAI
      const classification = await classifyContent(chunk.text);

      // Map to rubric with Claude
      const rubricMapping = await mapToRubric(
        classification,
        chunk.text,
        { start: chunk.pageStart || 0, end: chunk.pageEnd || 0 }
      );

      // Count terms
      const termCounts = countTerms(chunk.text, termLists, chunk.pageStart || 0);

      // Save chunk result
      await prisma.chunkResult.create({
        data: {
          chunkId: chunk.id,
          violenceScore: rubricMapping.violenceScore,
          sexualContentScore: rubricMapping.sexualContentScore,
          profanityScore: rubricMapping.profanityScore,
          hateScore: rubricMapping.hateScore,
          selfHarmScore: rubricMapping.selfHarmScore,
          rawClassification: classification as any,
          rubricMapping: rubricMapping as any,
          flaggedTerms: termCounts as any,
          confidence: rubricMapping.confidence,
          rationale: rubricMapping.rationale,
          evidence: rubricMapping.evidence as any
        }
      });

      // Update progress
      const progress = 40 + Math.floor((i / chunkRecords.length) * 40);
      await updateJobProgress(prisma, documentId, 'CLASSIFICATION', progress);
    }

    await updateJobStatus(prisma, documentId, 'CLASSIFICATION', 'COMPLETED', 80);

    // Step 3: Aggregate results
    await updateJobStatus(prisma, documentId, 'AGGREGATION', 'RUNNING', 85);

    const chunkResults = await prisma.chunkResult.findMany({
      where: {
        chunk: { documentId }
      },
      include: {
        chunk: true
      }
    });

    // Aggregate rubrics
    const rubricMappings = chunkResults.map(cr => ({
      violenceScore: cr.violenceScore || 0,
      sexualContentScore: cr.sexualContentScore || 0,
      profanityScore: cr.profanityScore || 0,
      hateScore: cr.hateScore || 0,
      selfHarmScore: cr.selfHarmScore || 0,
      rationale: cr.rationale || '',
      confidence: cr.confidence || 0,
      evidence: (cr.evidence as any) || []
    }));

    const aggregatedRubric = await aggregateRubrics(rubricMappings);

    // Aggregate term counts
    const termCountResults = chunkResults.map(cr => cr.flaggedTerms as any);
    const aggregatedTerms = aggregateTermCounts(termCountResults);

    // Collect evidence excerpts
    const evidenceExcerpts = chunkResults
      .flatMap(cr => (cr.evidence as any)?.slice(0, 2) || [])
      .slice(0, 10); // Top 10 evidence items

    // Save document result
    await prisma.documentResult.create({
      data: {
        documentId,
        overallRating: aggregatedRubric.overallRating,
        violenceScore: aggregatedRubric.avgViolence,
        sexualContentScore: aggregatedRubric.avgSexualContent,
        profanityScore: aggregatedRubric.avgProfanity,
        hateScore: aggregatedRubric.avgHate,
        selfHarmScore: aggregatedRubric.avgSelfHarm,
        confidence: aggregatedRubric.confidence,
        totalFlaggedTerms: aggregatedTerms.totalCount,
        flaggedTermsByCategory: aggregatedTerms.byCategory as any,
        summary: aggregatedRubric.summary,
        rationale: aggregatedRubric.summary,
        evidenceExcerpts: evidenceExcerpts as any
      }
    });

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'COMPLETED' }
    });

    await updateJobStatus(prisma, documentId, 'AGGREGATION', 'COMPLETED', 100);

  } catch (error) {
    console.error('Processing error:', error);

    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' }
    });

    await prisma.job.updateMany({
      where: {
        documentId,
        status: 'RUNNING'
      },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}

/**
 * Helper to update job status
 */
async function updateJobStatus(
  prisma: PrismaClient,
  documentId: string,
  jobType: string,
  status: string,
  progress: number
): Promise<void> {
  const existing = await prisma.job.findFirst({
    where: { documentId, jobType: jobType as any }
  });

  if (existing) {
    await prisma.job.update({
      where: { id: existing.id },
      data: {
        status: status as any,
        progress,
        startedAt: status === 'RUNNING' ? new Date() : existing.startedAt,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : null
      }
    });
  } else {
    await prisma.job.create({
      data: {
        documentId,
        jobType: jobType as any,
        status: status as any,
        progress,
        startedAt: status === 'RUNNING' ? new Date() : null
      }
    });
  }
}

/**
 * Helper to update job progress only
 */
async function updateJobProgress(
  prisma: PrismaClient,
  documentId: string,
  jobType: string,
  progress: number
): Promise<void> {
  await prisma.job.updateMany({
    where: {
      documentId,
      jobType: jobType as any
    },
    data: { progress }
  });
}
