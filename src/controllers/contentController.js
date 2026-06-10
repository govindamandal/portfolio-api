const { requireAdmin } = require('../lib/auth')
const { sendMethodNotAllowed } = require('../lib/http')
const {
  createDocument,
  deleteDocument,
  getProjectBySlug,
  getSitePayload,
  listAdmin,
  listPublic,
  updateDocument
} = require('../services/contentService')

async function publicSite(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET'])
  }

  return res.json(await getSitePayload())
}

async function publicCollection(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET'])
  }

  const { collection } = req.query
  return res.json({ items: await listPublic(collection) })
}

async function publicProjectDetail(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET'])
  }

  const project = await getProjectBySlug(req.query.slug)
  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  return res.json({ item: project })
}

async function adminCollection(req, res) {
  await requireAdmin(req)
  const { collection } = req.query

  if (req.method === 'GET') {
    return res.json({ items: await listAdmin(collection) })
  }

  if (req.method === 'POST') {
    return res.status(201).json({ item: await createDocument(collection, req.body) })
  }

  return sendMethodNotAllowed(res, ['GET', 'POST'])
}

async function adminCollectionItem(req, res) {
  await requireAdmin(req)
  const { collection, id } = req.query

  if (req.method === 'PUT') {
    return res.json({ item: await updateDocument(collection, id, req.body) })
  }

  if (req.method === 'DELETE') {
    await deleteDocument(collection, id)
    return res.json({ ok: true })
  }

  return sendMethodNotAllowed(res, ['PUT', 'DELETE'])
}

module.exports = {
  adminCollection,
  adminCollectionItem,
  publicCollection,
  publicProjectDetail,
  publicSite
}
