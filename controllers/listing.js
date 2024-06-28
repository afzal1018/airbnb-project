const Listing = require("../models/listing.js")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("index.ejs", { allListings });
};


module.exports.renderNewRoute = (req, res) => {
  res.render("new.ejs");
};


module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
        model: "User",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing doesn't exist!");
    res.redirect("/listings")
  }
  res.render("show.ejs", { listing });
};

// module.exports.createListing = async (req, res, next) => {
//   try {
//     let geoResponse = await geocodingClient.forwardGeocode({
//       query: req.body.listing.location,
//       limit: 1
//     }).send();
//     console.log(geoResponse.body.features);

// if (!geoResponse.body.features.length) {
//   throw new ExpressError('Location not found', 400);
// }

//     let url = req.file.path;
//     let filename = req.file.filename;
//     console.log(url, ",,", filename);

//     const newListing = new Listing(req.body.listing);
//     newListing.owner = req.user._id;
//     newListing.image = { url, filename };

//     newListing.geometry = geoResponse.body.features[0].geometry;

//     let savedListing = await newListing.save();
//     console.log(savedListing);

//     req.flash("success", "New listing Created!");
//     res.redirect("/listings");

//   } catch (err) {
//     next(err);
//   }
// };


module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
  }).send();
  let url = req.file.path;
  let filename = req.file.filename
  ;
  console.log(url, ",,", filename);
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename }

  newListing.geometry = response.body.features[0].geometry;

  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "New listing Created!");
  res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing doesn't exist!");
    res.redirect("/listings")
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250")
  res.render("edit.ejs", { listing, originalImageUrl });
};


module.exports.updateListing = async (req, res) => {
  if (!req.body.listing) {
    throw new ExpressError(400, "send valid data for listing")
  }
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Edited listing!");
  res.redirect(`/listings/${id}`);
};


module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Deleted listing!");
  res.redirect("/listings");
};