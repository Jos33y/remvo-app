/* ──────────────────────────────────────────────────────────────────
 * lib/feeTables.js: eBay's rates for the public fee calculator (tools1)
 *
 * remvo.app's calculator pages are pre-rendered HTML, so the rates they
 * show by category are written into the page here, not fetched. They
 * are copied from remvo-api's fee table (GET /v1/profit/sites/:site),
 * which is what every sum actually uses; the tools1 test checks this
 * file against the live API answer, field for field, so the page and
 * the sums cannot drift apart. When eBay changes a fee: change the API
 * table first, then copy its answer here.
 * ────────────────────────────────────────────────────────────────── */

export const FEE_TABLES = Object.freeze({
  "US": {
    "marketplace": "US",
    "currency": "USD",
    "checked": "2026-10-17",
    "split": false,
    "vat": null,
    "standard": {
      "key": "standard",
      "label": "Most categories",
      "text": "13.6% up to $7,500, then 2.35%"
    },
    "groups": [],
    "private": null
  },
  "UK": {
    "marketplace": "UK",
    "currency": "GBP",
    "checked": "2026-10-17",
    "split": true,
    "vat": 0.2,
    "standard": {
      "key": "standard",
      "label": "Everything else",
      "text": "12.9%"
    },
    "groups": [
      {
        "key": "phones-headphones-home-audio-and-tvs",
        "label": "Phones, headphones, home audio and TVs",
        "text": "6.9% up to £1,000, then 3%"
      },
      {
        "key": "cameras",
        "label": "Cameras",
        "text": "6.9% up to £1,000, then 3%"
      },
      {
        "key": "computers-and-tablets",
        "label": "Computers and tablets",
        "text": "6.9% up to £1,000, then 3%"
      },
      {
        "key": "video-game-consoles",
        "label": "Video game consoles",
        "text": "6.9% up to £400, then 2%"
      },
      {
        "key": "appliances-and-diy-tools",
        "label": "Appliances and DIY tools",
        "text": "6.9% up to £400, then 3%"
      },
      {
        "key": "power-strips",
        "label": "Power strips",
        "text": "9.9% up to £250, then 7.9%"
      },
      {
        "key": "furniture-and-bathroom",
        "label": "Furniture and bathroom",
        "text": "10.9% up to £500, 7.9% to £1,000, then 3%"
      },
      {
        "key": "trainers",
        "label": "Trainers",
        "text": "11.9%"
      },
      {
        "key": "women-s-bags",
        "label": "Women's bags",
        "text": "12.9% up to £800, then 7%"
      },
      {
        "key": "watches",
        "label": "Watches",
        "text": "12.9% up to £750, then 3%"
      },
      {
        "key": "jewellery-and-watches",
        "label": "Jewellery and watches",
        "text": "14.9% up to £1,000, then 4%"
      },
      {
        "key": "hair-extensions-and-wigs",
        "label": "Hair extensions and wigs",
        "text": "11.9%"
      },
      {
        "key": "electronic-smoking",
        "label": "Electronic smoking",
        "text": "12.9%"
      },
      {
        "key": "tents",
        "label": "Tents",
        "text": "10.9% up to £250, then 7.9%"
      },
      {
        "key": "tyres-sat-navs-and-power-tools",
        "label": "Tyres, sat navs and power tools",
        "text": "6.9% up to £750, then 3%"
      },
      {
        "key": "vehicle-parts",
        "label": "Vehicle parts",
        "text": "9.5% up to £750, then 3%"
      },
      {
        "key": "coins",
        "label": "Coins",
        "text": "10.9% up to £450, then 3%"
      },
      {
        "key": "holidays-and-travel",
        "label": "Holidays and travel",
        "text": "7.9% up to £650, then 3%"
      },
      {
        "key": "home-furniture-and-diy",
        "label": "Home, furniture and DIY",
        "text": "11.9% up to £500, then 7.9%"
      },
      {
        "key": "clothes-shoes-and-accessories",
        "label": "Clothes, shoes and accessories",
        "text": "11.9%"
      },
      {
        "key": "books-films-music-computers-phones-sound-and-vision-cameras-games",
        "label": "Books, films, music, computers, phones, sound and vision, cameras, games",
        "text": "9.9%"
      },
      {
        "key": "antiques-art-baby-collectables-garden-health-and-beauty-instruments-sport-toys",
        "label": "Antiques, art, baby, collectables, garden, health and beauty, instruments, sport, toys",
        "text": "10.9%"
      },
      {
        "key": "business-office-and-industrial",
        "label": "Business, office and industrial",
        "text": "12.5%"
      },
      {
        "key": "crafts-tickets-pets-wholesale",
        "label": "Crafts, tickets, pets, wholesale",
        "text": "12.9%"
      },
      {
        "key": "memorials",
        "label": "Memorials",
        "text": "11.9%"
      }
    ],
    "private": {
      "fees": "none",
      "buyerProtection": true
    }
  }
});

/* The Buyer Protection fee eBay.co.uk adds for a private seller's buyer
 * (eBay help id 5594): 10p an item, then 7% of the price up to £20, 4%
 * of the part from £20 to £300, 2% of the part from £300 to £4,000. */
export const UK_BUYER_PROTECTION = Object.freeze([
  ['Each item', '10p'],
  ['Up to £20', '7%'],
  ['£20 to £300', '4%'],
  ['£300 to £4,000', '2%'],
  ['Above £4,000', 'nothing more'],
]);

/* The answer each page opens with, before the visitor types anything:
 * remvo-api's sum for the starting figures below (also checked by the
 * tools1 test). Written into the page so it is there before any script. */
export const START = Object.freeze({
  US: { price: 25, sellerType: null, groupKey: 'standard' },
  UK: { price: 20, sellerType: 'business', groupKey: 'standard' },
});

export const START_PROFIT = Object.freeze({
  "US": {
    "currency": "USD",
    "checked": "2026-10-17",
    "sellerType": null,
    "asks": false,
    "vatRegistered": false,
    "vatRate": null,
    "ready": false,
    "price": 25,
    "postCharged": 0,
    "adRate": null,
    "rate": {
      "label": "Most categories",
      "text": "13.6% up to $7,500, then 2.35%",
      "bands": [
        [
          null,
          0.136
        ]
      ],
      "base": 25,
      "own": false,
      "matched": true,
      "key": "standard"
    },
    "fees": [
      {
        "key": "final",
        "label": "Final value fee",
        "amount": 3.4
      },
      {
        "key": "order",
        "label": "Per-order fee",
        "amount": 0.4
      }
    ],
    "feesTotal": 3.8,
    "takes": 15.2,
    "income": 25,
    "buyer": null,
    "needs": [
      "cost"
    ]
  },
  "UK": {
    "currency": "GBP",
    "checked": "2026-10-17",
    "sellerType": "business",
    "asks": false,
    "vatRegistered": false,
    "vatRate": 0.2,
    "ready": false,
    "price": 20,
    "postCharged": 0,
    "adRate": null,
    "rate": {
      "label": "Everything else",
      "text": "12.9%",
      "bands": [
        [
          null,
          0.129
        ]
      ],
      "base": 20,
      "own": false,
      "matched": true,
      "key": "standard"
    },
    "fees": [
      {
        "key": "final",
        "label": "Final value fee",
        "amount": 2.58
      },
      {
        "key": "order",
        "label": "Per-order fee",
        "amount": 0.4
      },
      {
        "key": "regulatory",
        "label": "Regulatory operating fee",
        "amount": 0.07
      },
      {
        "key": "vat",
        "label": "VAT on fees, 20%",
        "reclaimed": false,
        "amount": 0.61
      }
    ],
    "feesTotal": 3.66,
    "takes": 18.3,
    "income": 20,
    "buyer": null,
    "needs": [
      "cost"
    ]
  }
});
