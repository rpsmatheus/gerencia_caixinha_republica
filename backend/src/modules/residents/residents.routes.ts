import { Router } from 'express';
import { asyncHandler } from '../../shared/middlewares/asyncHandler.js';
import { ResidentFactory } from '../../factories/ResidentFactory.js';
import { residentRepo } from '../../app/appContext.js'; 

export const residentRoutes = Router();

// GET /api/residents - Listar (paginado, aceitando busca e filtro de ativo)
residentRoutes.get('/', asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page as string)  || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const isActive = req.query.isActive === 'false' ? false : true;

  // Passando os filtros para o repositório, matando os requisitos do comentário do plano!
  const { data, total } = await residentRepo.findAll(page, limit, search, isActive);
  
  res.json({ 
    success: true, 
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) } 
  });
}));

// GET /api/residents/search - Busca filtrada específica (requisito do comentário)
residentRoutes.get('/search', asyncHandler(async (req, res) => {
  const query = (req.query.q as string) || '';
  const data = await residentRepo.search(query);
  res.json({ success: true, data });
}));

// GET /api/residents/:id - Buscar por ID
residentRoutes.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const resident = await residentRepo.findById(id);
  
  if (!resident) {
    return res.status(404).json({ success: false, error: 'Morador não encontrado' });
  }
  
  res.json({ success: true, data: resident });
}));

// POST /api/residents - Criar morador
residentRoutes.post('/', asyncHandler(async (req, res) => {
  const resident = ResidentFactory.create(req.body);
  await residentRepo.save(resident);
  res.status(201).json({ success: true, data: resident });
}));

// PUT /api/residents/:id - Atualizar morador
residentRoutes.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedResident = await residentRepo.update(id, req.body);
  res.json({ success: true, data: updatedResident });
}));

// DELETE /api/residents/:id - Deletar/Desativar morador
residentRoutes.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await residentRepo.delete(id);
  res.json({ success: true, message: 'Morador removido com sucesso' });
}));