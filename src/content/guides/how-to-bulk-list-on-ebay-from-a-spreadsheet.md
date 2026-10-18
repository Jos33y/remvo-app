---
title: How to bulk list on eBay from a spreadsheet
description: Upload a spreadsheet of products to eBay as drafts with Seller Hub Reports: the template, the columns that matter, the upload, and how to publish.
short: In Seller Hub, open Reports, then Upload, and download the "Create drafts" template. Fill in one row per product (only Action and Category ID are required), save it as a CSV and upload it. The drafts usually arrive within 15 minutes, ready for photos and a final check before you publish.
published: 2026-10-18
checked: 2026-10-18
action: bulk
topic: bulk
sources:
  - eBay Help: Seller Hub Reports (eBay.com) | https://www.ebay.com/help/selling/selling-tools/seller-hub-reports?id=4096
  - eBay Help: Seller Hub Reports (eBay.co.uk) | https://www.ebay.co.uk/help/selling/selling-tools/seller-hub-reports?id=4096
  - eBay: Inventory onboarding guide, create listings in bulk | https://pages.ebay.com/sh/reports/help/create-listings-bulk/
  - eBay Developers: item condition IDs | https://developer.ebay.com/api-docs/sell/static/metadata/condition-id-values.html
---

## What you need

- An eBay seller account with Seller Hub (it is in the menu as **Seller Hub** on eBay.com and eBay.co.uk).
- Your products in a spreadsheet: for each one, a title, its eBay category, the barcode, a price and the condition.

## 1. Download the drafts template

1. In Seller Hub, open the **Reports** tab and select **Upload** on the left.
2. Select **Get template**. Under Source choose **Listings**, and under Type choose **Create drafts template**.
3. Download it as **.csv**, or as **.xlsx** if you work in Excel.

Use the drafts template rather than "Create new listings". Drafts land in your Drafts folder unpublished, so nothing goes live until you have checked it.

## 2. Fill in one row per product

Only **Action** and **Category ID** are required. The rest are worth filling, because every column you leave empty is a field you type later on eBay.

| Column | What to put |
|---|---|
| Action | `Draft` on every row |
| Category ID | eBay's number for the most specific category, such as `111694` for Audio Docks & Mini Speakers |
| Title | Up to 80 characters: brand, model, what it is, key details |
| UPC | The barcode on the box |
| Start price | Your price |
| Condition ID | `1000` New, `1500` New other, `3000` Used, `7000` For parts or not working |
| Format | `FixedPrice` for Buy It Now |
| Quantity | How many you have |
| Custom label (SKU) | Your own stock code, so you can match drafts to your stock |

Not every category accepts every condition. If a row is rejected, check that the condition is one that category allows.

**Excel and barcodes:** Excel drops the leading zero from barcodes and turns long ones into numbers like `7.5E+11`. Format the barcode column as **Text** before you paste them in.

## 3. Save it as a CSV and upload it

Save the file as CSV, go back to **Reports**, then **Upload**, and upload it. eBay says this usually takes less than 15 minutes; very large files take longer. You can create up to 2,000 drafts a day.

## 4. Finish and publish the drafts

When the upload is done, select **Complete listings** (also under **Recent uploads**). This opens your drafts in eBay's bulk editor, where you:

1. add your photos;
2. fill in the item specifics (the drafts template has no columns for them);
3. check postage and returns;
4. publish.

Drafts are deleted after 30 to 45 days, so publish them before then.

## The slow part, and how to skip it

The upload takes minutes. Filling in the spreadsheet is what takes hours: a title that fits, the right category ID, the item specifics and a price for every row.

[Remvo](/) fills them in from the barcode: the title, category, item specifics, parcel and a price from live eBay listings. Paste or scan your barcodes, or upload your spreadsheet, up to 500 at a time. You get back the eBay drafts file, ready to upload as in step 3, and a full CSV with every item specific to copy into the drafts. A listing costs $0.30 (£0.24), and your first one is free.
