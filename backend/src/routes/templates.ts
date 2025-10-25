import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function templateRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/templates
   * Get all export templates
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const templates = await fastify.prisma.template.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({ templates });

    } catch (error) {
      fastify.log.error('Get templates error:', error);
      return reply.code(500).send({
        error: 'Failed to get templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/templates
   * Create a new template
   */
  fastify.post('/', async (request: FastifyRequest<{
    Body: {
      name: string;
      format: string;
      template: any;
      description?: string;
      isDefault?: boolean;
    }
  }>, reply: FastifyReply) => {
    try {
      const { name, format, template, description, isDefault = false } = request.body;

      if (!name || !format || !template) {
        return reply.code(400).send({
          error: 'Missing required fields: name, format, template'
        });
      }

      // If setting as default, unset other defaults for the same format
      if (isDefault) {
        await fastify.prisma.template.updateMany({
          where: { format, isDefault: true },
          data: { isDefault: false }
        });
      }

      const newTemplate = await fastify.prisma.template.create({
        data: {
          name,
          format,
          template,
          description,
          isDefault
        }
      });

      return reply.code(201).send({ template: newTemplate });

    } catch (error) {
      fastify.log.error('Create template error:', error);
      return reply.code(500).send({
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/templates/:id
   * Get a specific template
   */
  fastify.get('/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const template = await fastify.prisma.template.findUnique({
        where: { id }
      });

      if (!template) {
        return reply.code(404).send({ error: 'Template not found' });
      }

      return reply.send({ template });

    } catch (error) {
      fastify.log.error('Get template error:', error);
      return reply.code(500).send({
        error: 'Failed to get template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * PUT /api/templates/:id
   * Update a template
   */
  fastify.put('/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      name?: string;
      template?: any;
      description?: string;
      isDefault?: boolean;
    }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { name, template, description, isDefault } = request.body;

      // If setting as default, unset other defaults for the same format
      if (isDefault) {
        const current = await fastify.prisma.template.findUnique({
          where: { id }
        });

        if (current) {
          await fastify.prisma.template.updateMany({
            where: { format: current.format, isDefault: true, id: { not: id } },
            data: { isDefault: false }
          });
        }
      }

      const updated = await fastify.prisma.template.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(template && { template }),
          ...(description !== undefined && { description }),
          ...(isDefault !== undefined && { isDefault })
        }
      });

      return reply.send({ template: updated });

    } catch (error) {
      fastify.log.error('Update template error:', error);
      return reply.code(500).send({
        error: 'Failed to update template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * DELETE /api/templates/:id
   * Delete a template
   */
  fastify.delete('/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      await fastify.prisma.template.delete({
        where: { id }
      });

      return reply.send({ message: 'Template deleted successfully' });

    } catch (error) {
      fastify.log.error('Delete template error:', error);
      return reply.code(500).send({
        error: 'Failed to delete template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
