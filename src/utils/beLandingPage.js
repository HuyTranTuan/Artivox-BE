const beLandingPage = (req, res) => {
  const landingPage =
    process.env.NODE_ENV === "production"
      ? process.env.LANDING_PAGE_PRODUCTION
      : process.env.LANDING_PAGE;
  res.send(`${landingPage}`);
};

module.exports = beLandingPage;
