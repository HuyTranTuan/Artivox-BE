const { fullUrl } = require("@/utils/url");

function postTransformer(posts) {
  return posts.map((post) => ({
    ...post,
    image: fullUrl(post.image),
  }));
}

module.exports = postTransformer;
