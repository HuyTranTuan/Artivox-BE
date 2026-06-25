const modelsService = require("@services/models.service");
const { getPresignedUrl, keyFromUrl } = require("@services/modelStream.service");
const catchAsync = require("@utils/catchAsync");
const { normalizeCatalogPagination } = require("@utils/catalogPagination");
const { clearCache, patchCacheField } = require("@middlewares/cache.middleware");

// Fetch all model products
const getModels = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  const isAdminOrStaff = req.user && (req.user.role === "ADMIN" || req.user.role === "STAFF");
  if (!isAdminOrStaff) {
    query.isActive = true;
  }
  const data = await modelsService.getModels(query);

  if (!isAdminOrStaff) {
    data.items.forEach(item => {
      item.has3DModel = !!item.sourceFileUrl;
      item.fileExtension = item.sourceFileUrl?.split('.').pop() || "glb";
      delete item.sourceFileUrl;
      if (item.model3D) {
        item.model3D.fileExtension = item.model3D.sourceFileUrl?.split('.').pop() || "glb";
        delete item.model3D.sourceFileUrl;
      }
    });
  }

  return res.paginatedSuccess(
    data.items,
    {
      total: data.total,
      limit: data.limit,
      skip: data.skip,
    },
    "Models fetched",
  );
});

// Fetch a single model product by slug
const getModelBySlug = catchAsync(async (req, res) => {
  const query = {};
  const isAdminOrStaff = req.user && (req.user.role === "ADMIN" || req.user.role === "STAFF");
  if (!isAdminOrStaff) {
    query.isActive = true;
  }
  const data = await modelsService.getModelBySlug(req.params.slug, query);
  if (!data) return res.notFound();

  if (!isAdminOrStaff) {
    data.has3DModel = !!data.sourceFileUrl;
    if (data.sourceFileUrl) {
      data.fileExtension = data.sourceFileUrl.split('.').pop();
    } else {
      const axios = require("axios");
      const { getPresignedUrl } = require("@services/modelStream.service");
      const checkFile = async (testKey) => {
        try {
          const url = await getPresignedUrl(testKey, 60);
          const response = await axios({ method: "GET", url, responseType: "stream" });
          response.data.destroy();
          return true;
        } catch (error) {
          return false;
        }
      };

      if (await checkFile(`models/${req.params.slug}.fbx`)) {
        data.fileExtension = "fbx";
        data.has3DModel = true;
      } else if (await checkFile(`models/${req.params.slug}.glb`)) {
        data.fileExtension = "glb";
        data.has3DModel = true;
      } else {
        data.fileExtension = "glb";
      }
    }
    delete data.sourceFileUrl;
    if (data.model3D) {
      data.model3D.fileExtension = data.model3D.sourceFileUrl ? data.model3D.sourceFileUrl.split('.').pop() : data.fileExtension;
      delete data.model3D.sourceFileUrl;
    }
  }

  return res.success(data, "Model detail fetched");
});

// Get 60s Presigned URL for 3D model file
const getPresignedModelUrl = catchAsync(async (req, res) => {
  const query = {};
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    query.isActive = true;
  }
  const slug = req.params.slug;
  const product = await modelsService.getModelBySlug(slug, query);
  if (!product) return res.notFound();

  let finalPresignedUrl = null;

  if (product.sourceFileUrl) {
    const key = keyFromUrl(product.sourceFileUrl);
    finalPresignedUrl = await getPresignedUrl(key, 60);
  } else {
    // Fallback: Check R2 directly for fbx or glb
    const axios = require("axios");
    const checkFile = async (testKey) => {
      try {
        const url = await getPresignedUrl(testKey, 60);
        const response = await axios({ method: "GET", url, responseType: "stream" });
        response.data.destroy(); // Abort the download stream
        return url;
      } catch (error) {
        if (error.response && (error.response.status === 404 || error.response.status === 403)) return null;
        throw error;
      }
    };

    finalPresignedUrl = await checkFile(`models/${slug}.fbx`);
    if (!finalPresignedUrl) {
      finalPresignedUrl = await checkFile(`models/${slug}.glb`);
    }
  }

  if (!finalPresignedUrl) {
    return res.status(404).json({ message: "No 3D file for this model" });
  }

  return res.success({ presignedUrl: finalPresignedUrl }, "Presigned URL generated");
});

const createModel = catchAsync(async (req, res) => {
  const bodyData = { ...req.body };
  const data = await modelsService.createModel(bodyData, req.files);
  await clearCache("models:*");
  await clearCache("products:*");
  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");
  return res.success(data, "Model created");
});

const updateModel = catchAsync(async (req, res) => {
  const bodyData = { ...req.body };
  const data = await modelsService.updateModel(req.params.slug, bodyData, req.files);
  if (!data) return res.notFound();
  // Immediately patch price in cached list/detail entries before wiping
  if (bodyData.basePrice !== undefined) {
    await patchCacheField("models:*", req.params.slug, { basePrice: data.basePrice });
    await patchCacheField("products:*", req.params.slug, { basePrice: data.basePrice });
  }
  await clearCache("models:*");
  await clearCache("model:*");
  await clearCache("products:*");
  await clearCache("product:*");
  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");
  return res.success(data, "Model updated");
});

const deleteModel = catchAsync(async (req, res) => {
  const data = await modelsService.deleteModel(req.params.slug);
  if (!data) return res.notFound();
  await clearCache("models:*");
  await clearCache("model:*");
  await clearCache("products:*");
  await clearCache("product:*");
  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");
  return res.success(null, "Model deleted successfully");
});

const proxy3DModel = catchAsync(async (req, res) => {
  const { slug } = req.query;
  const dest = req.headers["sec-fetch-dest"];

  // Block direct browser downloads (e.g. open in new tab)
  if (dest === "document" || dest === "iframe") {
    return res.status(403).json({ message: "Direct download forbidden" });
  }

  const query = {};
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    query.isActive = true;
  }
  
  const product = await modelsService.getModelBySlug(slug, query);
  if (!product) {
    return res.status(404).json({ message: "Not found" });
  }

  const axios = require("axios");

  const tryStream = async (testKey) => {
    try {
      const presignedUrl = await getPresignedUrl(testKey, 60);
      const response = await axios({
        method: "GET",
        url: presignedUrl,
        responseType: "stream"
      });
      return response;
    } catch (error) {
      if (error.response && (error.response.status === 404 || error.response.status === 403)) return null;
      throw error;
    }
  };

  let response;
  if (product.sourceFileUrl) {
    response = await tryStream(keyFromUrl(product.sourceFileUrl));
  } else {
    // Fallback: Check R2 directly for fbx or glb if missing from DB
    response = await tryStream(`models/${slug}.fbx`);
    if (!response) {
      response = await tryStream(`models/${slug}.glb`);
    }
  }

  if (!response) {
    return res.status(404).json({ message: "Not found on R2" });
  }

  res.setHeader("Content-Type", "application/octet-stream");
  const origin = req.headers.origin;
  try {
    const allowedOrigins = JSON.parse(process.env.CORS_ORIGINS || '[]');
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
    }
  } catch(e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  
  // Stream data directly to the client
  response.data.pipe(res);
});

module.exports = { getModels, getModelBySlug, getPresignedModelUrl, createModel, updateModel, deleteModel, proxy3DModel };
