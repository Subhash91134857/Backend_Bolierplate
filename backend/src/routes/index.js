module.exports = (app) => {
    app.use("/api/v1/slon", () => {
        console.log("Done")
    });
}