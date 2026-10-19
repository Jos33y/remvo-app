---
title: How to list on eBay from a barcode
description: Start an eBay listing from the barcode on the box: which number to use, what eBay's catalogue fills in, what to check, and what to do with no barcode.
short: The barcode on the box is the product's GTIN: 12 digits (UPC) on most US products, 13 (EAN) in the UK and Europe, an ISBN on books. Start your listing with that number. If the product is in eBay's catalogue, its title, item specifics and stock photo come with it. Check every field, set the condition and price, and use your own photos if it isn't new.
published: 2026-10-19
checked: 2026-10-19
action: scan
topic: listing
art: barcode
sources:
  - GS1 US: What is a GTIN | https://www.gs1us.org/upcs-barcodes-prefixes/what-is-a-gtin
  - eBay Developers: listing with catalogue products | https://developer.ebay.com/api-docs/user-guides/static/trading-user-guide/catalog-products.html
  - eBay Developers: listing title, 80 characters | https://developer.ebay.com/api-docs/user-guides/static/trading-user-guide/listing-title.html
  - eBay Developers: when a product has no GTIN | https://developer.ebay.com/api-docs/sell/static/inventory/product-identifier-text.html
  - eBay Help: Picture policy | https://www.ebay.com/help/policies/listing-policies/picture-policy?id=4370
related:
  - how-to-list-a-returns-pallet-on-ebay
  - how-to-bulk-list-on-ebay-from-a-spreadsheet
---

## 1. Find the right number

The digits under the barcode are the product's GTIN, the number that identifies that exact product everywhere it is sold.

| On the box | Digits | Where you see it |
|---|---|---|
| UPC (GTIN-12) | 12 | Most products made for the US and Canada |
| EAN (GTIN-13) | 13 | Most products made for the UK and Europe |
| ISBN | 13, starting 978 or 979 | Books |

A 12-digit UPC is sometimes read as 13 digits with a `0` in front. It is the same product: `012345678905` and `0012345678905` mean one thing.

## 2. Start the listing with it

When you create a listing, search for your product by its barcode number. If eBay's catalogue holds that product, the listing can take the catalogue's title, description, item specifics and stock photo.

If nothing matches, list it from scratch and still put the barcode in the **UPC** or **EAN** item specific, so the number is on the listing.

## 3. Check everything that came with it

A catalogue match is a start, not a finished listing.

- **Title:** up to 80 characters. Lead with the brand and model, then what it is, then the detail buyers filter by, such as colour or size. Catalogue titles are often shorter than they could be.
- **Item specifics:** brand, MPN, colour and the rest. Fill in every one you can; buyers filter by them.
- **Condition and price:** set these yourself. Price from what has sold in the same condition, not from what is listed.

## 4. Photos

A stock photo is fine for a new, sealed item. For anything used, damaged or defective, eBay does not allow stock photos: photograph the actual item.

## No barcode?

If the category asks for a barcode and the product has none, enter **Does not apply** on eBay.com. Other eBay sites use their own words for it, such as **Nicht zutreffend** on eBay.de.

## The slow part, and how to skip it

The catalogue gives you a start. Writing a title that fills the 80 characters, finding the right category, filling every item specific and pricing it is the slow part.

[Remvo](/) does all of it from the barcode in about 20 seconds: scan it with your phone, use a barcode scanner, or paste the number. You get the title, description, category, item specifics, parcel size and weight, and a price from live eBay listings, in the language of your eBay site. A listing costs $0.30 (£0.24), and your first one is free.
