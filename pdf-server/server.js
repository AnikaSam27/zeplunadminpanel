const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/generate-pdf", async (req, res) => {
  try {
    const partner = req.body;

    const browser = await puppeteer.launch({
      headless: "new"
    });

    const page = await browser.newPage();

    const html = `
      <html>
      <head>
        <style>
          body { font-family: Arial; padding: 30px; }
          h2 { text-align: center; }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border: 1px solid #ccc;
          }
        </style>
      </head>
      <body>

        <h2>BOLTT KYC FORM</h2>

        <h3>Personal Details</h3>
        <p>Name: ${partner.name}</p>
        <p>Phone: ${partner.phone}</p>
        <p>Email: ${partner.email}</p>
        <p>Category: ${partner.category}</p>

        <h3>Address</h3>
        <p>${partner.address}</p>
        <p>${partner.city}</p>
        <p>${(partner.selectedAreas || []).join(", ")}</p>

        <h3>KYC</h3>
        <p>Aadhaar: ${partner.aadhaarNumber}</p>
        <p>PAN: ${partner.panNumber || "Not Provided"}</p>

        <h3>Documents</h3>
        <div class="grid">
          ${partner.aadhaarFrontUrl ? `<img src="${partner.aadhaarFrontUrl}" />` : ""}
          ${partner.aadhaarBackUrl ? `<img src="${partner.aadhaarBackUrl}" />` : ""}
          ${partner.selfieUrl ? `<img src="${partner.selfieUrl}" />` : ""}
          ${partner.panUrl ? `<img src="${partner.panUrl}" />` : ""}
        </div>

        <br/><br/>
        <p>Signature: __________________</p>

      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=KYC_${partner.name}.pdf`
    });

    res.send(pdf);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating PDF");
  }
});

app.listen(5000, () => console.log("PDF Server running on port 5000"));