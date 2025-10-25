import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function termListRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/term-lists
   * Get all term lists
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const termLists = await fastify.prisma.termList.findMany({
        orderBy: { category: 'asc' }
      });

      return reply.send({ termLists });

    } catch (error) {
      fastify.log.error('Get term lists error:', error);
      return reply.code(500).send({
        error: 'Failed to get term lists',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/term-lists
   * Create a new term list
   */
  fastify.post('/', async (request: FastifyRequest<{
    Body: {
      name: string;
      category: string;
      terms: string[];
      description?: string;
      isActive?: boolean;
    }
  }>, reply: FastifyReply) => {
    try {
      const { name, category, terms, description, isActive = true } = request.body;

      if (!name || !category || !terms || !Array.isArray(terms)) {
        return reply.code(400).send({
          error: 'Missing required fields: name, category, terms (array)'
        });
      }

      const termList = await fastify.prisma.termList.create({
        data: {
          name,
          category: category.toUpperCase() as any,
          terms,
          description,
          isActive
        }
      });

      return reply.code(201).send({ termList });

    } catch (error) {
      fastify.log.error('Create term list error:', error);
      return reply.code(500).send({
        error: 'Failed to create term list',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * PUT /api/term-lists/:id
   * Update a term list
   */
  fastify.put('/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      name?: string;
      terms?: string[];
      description?: string;
      isActive?: boolean;
    }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { name, terms, description, isActive } = request.body;

      const termList = await fastify.prisma.termList.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(terms && { terms }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive })
        }
      });

      return reply.send({ termList });

    } catch (error) {
      fastify.log.error('Update term list error:', error);
      return reply.code(500).send({
        error: 'Failed to update term list',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * DELETE /api/term-lists/:id
   * Delete a term list
   */
  fastify.delete('/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      await fastify.prisma.termList.delete({
        where: { id }
      });

      return reply.send({ message: 'Term list deleted successfully' });

    } catch (error) {
      fastify.log.error('Delete term list error:', error);
      return reply.code(500).send({
        error: 'Failed to delete term list',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
