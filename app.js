// server

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// urlencoded so that data that comes in req(like id) can be passed
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
// engine for ejsmate
app.engine("ejs", ejsMate);
// to use static file (inside public (css))
app.use(express.static(path.join(__dirname, "/public")));
// to create an middleware for validate schema on server side using joi
const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// connection to a MongoDB database using Mongoose wanderlust database naem
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(MONGO_URL);
}
// creating basic RESTFul api for performing CRED operations
app.get("/", (req, res) => {
  res.send("Hi , I am root");
});

// Index route(display all listings)
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);
// when the client visits the /listings/new page a get request is made to the server and the server responses  rendering and sending the processed HTML from new.ejs
// server checks the file new.ejs file in views folder automatically
//1)a)New Route(create new listings)
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Show Route(display detailed info listing )
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
  })
);

// 1)b) update created list in db (post route)

app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res, next) => {
    // let {title,description,image,price,country,location} = req.body ;
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    console.log(newListing);
    res.redirect("/listings");
  })
);

// update Route
// 2)a)edit Route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    console.log(id);
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  })
);
// 2)b)update Route

app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  })
);

//Delete Route
// app.delete(
//   "/listings/:id",
//   wrapAsync(async (req, res) => {
//     if (!req.body.listing) {
//       throw new ExpressError(400, "send valid data for listing");
//     }
//     let { id } = req.params;
//     let deletedListing = await Listing.findByIdAndDelete(id);
//     console.log(deletedListing);
//     res.redirect("/listings");
//   })
// );

app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    // Remove this check as it's not needed for deletion
    // if (!req.body.listing) {
    //   throw new ExpressError(400, "send valid data for listing");
    // }
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
  })
);

// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute",
//     country: "india",
//   });
//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

// app.use((err, req, res, next) => {
//
//   res.send("something went wrong");
// });

//  throws express error
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not found"));
});

// Catchs expresserror takes statuscode  and msg and then send to response
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  // res.status(statusCode).send(message);
  res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
