import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RATING_SCALE } from '../config/constants';

export default async function reportRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/reports/:id/export
   * Export document results in various formats
   */
  fastify.post('/:id/export', async (request: FastifyRequest<{
    Params: { id: string };
    Body: { format?: string; templateId?: string };
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { format = 'json', templateId } = request.body || {};

      const document = await fastify.prisma.document.findUnique({
        where: { id },
        include: {
          result: true
        }
      });

      if (!document || !document.result) {
        return reply.code(404).send({ error: 'Document or results not found' });
      }

      // Create audit log
      await fastify.prisma.auditLog.create({
        data: {
          documentId: document.id,
          action: 'EXPORT',
          metadata: { format, templateId }
        }
      });

      // Generate report based on format
      let reportData: any;
      let contentType: string;

      switch (format.toLowerCase()) {
        case 'json':
          reportData = generateJSONReport(document, document.result);
          contentType = 'application/json';
          break;

        case 'csv':
          reportData = generateCSVReport(document, document.result);
          contentType = 'text/csv';
          break;

        case 'markdown':
          reportData = generateMarkdownReport(document, document.result);
          contentType = 'text/markdown';
          break;

        default:
          return reply.code(400).send({ error: 'Unsupported format. Use: json, csv, markdown' });
      }

      // Set headers for download
      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', `attachment; filename="${document.filename}_report.${format}"`);

      return reply.send(reportData);

    } catch (error) {
      fastify.log.error('Export error:', error);
      return reply.code(500).send({
        error: 'Failed to export report',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/reports/:id/preview
   * Preview report without downloading
   */
  fastify.get('/:id/preview', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const document = await fastify.prisma.document.findUnique({
        where: { id },
        include: { result: true }
      });

      if (!document || !document.result) {
        return reply.code(404).send({ error: 'Document or results not found' });
      }

      const report = generateMarkdownReport(document, document.result);

      return reply.send({
        documentId: id,
        filename: document.filename,
        preview: report
      });

    } catch (error) {
      fastify.log.error('Preview error:', error);
      return reply.code(500).send({
        error: 'Failed to generate preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Report generation helpers

function generateJSONReport(document: any, result: any) {
  return JSON.stringify({
    document: {
      filename: document.filename,
      pageCount: document.pageCount,
      analyzedAt: result.createdAt
    },
    rating: {
      overall: result.overallRating,
      name: RATING_SCALE[result.overallRating as keyof typeof RATING_SCALE].name,
      description: RATING_SCALE[result.overallRating as keyof typeof RATING_SCALE].description
    },
    scores: {
      violence: result.violenceScore,
      sexualContent: result.sexualContentScore,
      profanity: result.profanityScore,
      hate: result.hateScore,
      selfHarm: result.selfHarmScore
    },
    confidence: result.confidence,
    flaggedTerms: {
      total: result.totalFlaggedTerms,
      byCategory: result.flaggedTermsByCategory
    },
    summary: result.summary,
    rationale: result.rationale,
    evidence: result.evidenceExcerpts
  }, null, 2);
}

function generateCSVReport(document: any, result: any) {
  const rows = [
    ['Field', 'Value'],
    ['Filename', document.filename],
    ['Page Count', document.pageCount || 'N/A'],
    ['Overall Rating', result.overallRating],
    ['Rating Name', RATING_SCALE[result.overallRating as keyof typeof RATING_SCALE].name],
    ['Violence Score', result.violenceScore],
    ['Sexual Content Score', result.sexualContentScore],
    ['Profanity Score', result.profanityScore],
    ['Hate Score', result.hateScore || 'N/A'],
    ['Self-Harm Score', result.selfHarmScore || 'N/A'],
    ['Confidence', result.confidence],
    ['Total Flagged Terms', result.totalFlaggedTerms],
    ['Summary', `"${result.summary}"`]
  ];

  return rows.map(row => row.join(',')).join('\n');
}

function generateMarkdownReport(document: any, result: any) {
  const ratingInfo = RATING_SCALE[result.overallRating as keyof typeof RATING_SCALE];
  const flaggedByCategory = result.flaggedTermsByCategory || {};

  return `# AI Content Review Report

## Document Information
- **Filename:** ${document.filename}
- **Pages:** ${document.pageCount || 'N/A'}
- **Analyzed:** ${new Date(result.createdAt).toLocaleString()}

---

## Overall Rating: ${result.overallRating}/5 - ${ratingInfo.name}

**Description:** ${ratingInfo.description}

**Confidence:** ${(result.confidence * 100).toFixed(1)}%

---

## Category Scores

| Category | Score (0-5) |
|----------|-------------|
| Violence | ${result.violenceScore.toFixed(2)} |
| Sexual Content | ${result.sexualContentScore.toFixed(2)} |
| Profanity | ${result.profanityScore.toFixed(2)} |
| Hate Speech | ${result.hateScore?.toFixed(2) || 'N/A'} |
| Self-Harm | ${result.selfHarmScore?.toFixed(2) || 'N/A'} |

---

## Flagged Content Summary

**Total Flagged Terms:** ${result.totalFlaggedTerms}

### By Category
${Object.entries(flaggedByCategory).map(([cat, count]) =>
  `- **${cat}:** ${count}`
).join('\n')}

---

## Analysis Summary

${result.summary}

---

## Rationale

${result.rationale}

${result.evidenceExcerpts && result.evidenceExcerpts.length > 0 ? `
---

## Evidence Excerpts

${result.evidenceExcerpts.slice(0, 5).map((evidence: any, idx: number) =>
  `${idx + 1}. **${evidence.category}** (Page ${evidence.page || 'N/A'}): "${evidence.quote}"`
).join('\n\n')}
` : ''}

---

*Generated by AI Content Review System*
`;
}
