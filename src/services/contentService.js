const { connectDb } = require('../lib/db')
const { normalizeAssetUrls } = require('../lib/assetUrls')
const { serialize } = require('../lib/http')
const { collectionModels } = require('../models')

const publicCollections = ['services', 'experiences', 'projects', 'skills', 'certifications', 'courses', 'testimonials']

function getModel(collection) {
  const Model = collectionModels[collection]
  if (!Model) {
    const error = new Error(`Unknown collection: ${collection}`)
    error.statusCode = 404
    error.publicMessage = 'Unknown collection'
    throw error
  }
  return Model
}

function publicFilter(collection) {
  const filter = {
    $or: [
      { isPublic: { $exists: false } },
      { isPublic: true }
    ]
  }

  if (collection === 'projects') {
    filter.status = { $ne: 'draft' }
  }

  return filter
}

function sortForCollection(collection) {
  if (collection === 'skills') {
    return { category: 1, displayOrder: 1, name: 1 }
  }
  if (collection === 'experiences') {
    return { currentlyWorking: -1, startDate: -1, displayOrder: 1 }
  }
  return { featured: -1, displayOrder: 1, createdAt: -1 }
}

async function listPublic(collection) {
  await connectDb()
  const Model = getModel(collection)
  const documents = await Model.find(publicFilter(collection)).sort(sortForCollection(collection))
  return documents.map((document) => normalizeAssetUrls(serialize(document)))
}

async function getSitePayload() {
  await connectDb()
  const Profile = getModel('profile')
  const SiteSetting = getModel('siteSettings')
  const [profile, siteSettings, ...lists] = await Promise.all([
    Profile.findOne(publicFilter('profile')),
    SiteSetting.findOne({ key: 'default' }),
    ...publicCollections.map((collection) => listPublic(collection))
  ])

  return {
    profile: normalizeAssetUrls(serialize(profile)),
    siteSettings: normalizeAssetUrls(serialize(siteSettings)),
    services: lists[0],
    experiences: lists[1],
    projects: lists[2],
    skills: lists[3],
    certifications: lists[4],
    courses: lists[5],
    testimonials: lists[6]
  }
}

async function listAdmin(collection) {
  await connectDb()
  const Model = getModel(collection)
  const documents = await Model.find({}).sort(sortForCollection(collection))
  return documents.map(serialize)
}

async function createDocument(collection, payload) {
  await connectDb()
  const Model = getModel(collection)
  const document = await Model.create(payload)
  return serialize(document)
}

async function updateDocument(collection, id, payload) {
  await connectDb()
  const Model = getModel(collection)
  delete payload._id
  const document = await Model.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  })
  return serialize(document)
}

async function deleteDocument(collection, id) {
  await connectDb()
  const Model = getModel(collection)
  await Model.findByIdAndDelete(id)
  return true
}

async function getProjectBySlug(slug) {
  await connectDb()
  const Project = getModel('projects')
  const project = await Project.findOne({ slug, ...publicFilter('projects') })
  return normalizeAssetUrls(serialize(project))
}

module.exports = {
  createDocument,
  deleteDocument,
  getProjectBySlug,
  getSitePayload,
  listAdmin,
  listPublic,
  updateDocument
}
