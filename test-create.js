require('module-alias/register');
const { createModel } = require('./src/services/models.service');

async function test() {
  try {
    const data = {
      name: "Test Model Script 2",
      slug: "test-model-script-2",
      description: "Test description",
      basePrice: "100",
      stock: "10",
      isActive: "true",
      previewFileUrl: "",
      sourceFileUrl: ""
    };
    
    // create a dummy file
    const dummyFile = {
      buffer: Buffer.from("dummy image data"),
      mimetype: "image/webp",
      originalname: "test.webp"
    };

    const files = {
      thumbnail_before: [dummyFile],
      thumbnail_after: [dummyFile],
      gallery: [dummyFile, dummyFile]
    };

    const res = await createModel(data, files);
    console.log("Success:", res);
  } catch (error) {
    console.error("Error creating model:", error);
  }
}

test();
