<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Next.js v16

All frontend pages must be server components first, unless they use client-specific features like hooks or state management. Use RSC where possible.

Backend
-   Laravel 12
-   PHP 8.4
- API base url
-   https://api-marketplace.banexmall.com/api
- API Documentation
-   https://documenter.getpostman.com/view/54810705/2sBXwjuDLs
- Auth endpoints
    -   Login: POST /api/auth/login
    -   Register: POST /api/auth/register
    -   Logout: POST /api/auth/logout
    -   Reset password: POST /api/auth/reset-password



## Collection: BANEX MARKETPLACE Endpoints

### Generic

#### Category

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/generic/categories`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "categories": [
            {
                "id": "019e6b6a-4b36-72f0-bd05-b1301254d4fa",
                "name": "Vehicles",
                "slug": "vehicles",
                "icon": "car",
                "sort_order": 1,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b3a-702d-8a61-e2e9280bd11f",
                "name": "Property",
                "slug": "property",
                "icon": "house",
                "sort_order": 2,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "icon": "smartphone",
                "sort_order": 3,
                "listings_count": 2,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b46-71bd-81e6-87651c24c66e",
                "name": "Electronics",
                "slug": "electronics",
                "icon": "laptop",
                "sort_order": 4,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b4c-71bf-be42-2f13f79f3fe6",
                "name": "Home & Garden",
                "slug": "home-garden",
                "icon": "sofa",
                "sort_order": 5,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
                "name": "Fashion",
                "slug": "fashion",
                "icon": "shirt",
                "sort_order": 6,
                "listings_count": 1,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b56-7122-95ce-cb7bca3d287f",
                "name": "Health & Beauty",
                "slug": "health-beauty",
                "icon": "sparkles",
                "sort_order": 7,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b5d-7262-84c5-30cf634a45c6",
                "name": "Sports & Outdoors",
                "slug": "sports-outdoors",
                "icon": "dumbbell",
                "sort_order": 8,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b68-7149-a169-ed7c67737031",
                "name": "Babies & Kids",
                "slug": "babies-kids",
                "icon": "baby",
                "sort_order": 9,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b6c-73ef-96be-8d569ddc5b5d",
                "name": "Pets",
                "slug": "pets",
                "icon": "paw",
                "sort_order": 10,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b70-736a-ae42-7ae99b5e09b8",
                "name": "Food & Agriculture",
                "slug": "food-agriculture",
                "icon": "apple",
                "sort_order": 11,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e6b6a-4b74-708e-8afd-6863d3bfa51f",
                "name": "Services & Jobs",
                "slug": "services-jobs",
                "icon": "briefcase",
                "sort_order": 12,
                "listings_count": 0,
                "image_url": null
            }
        ],
        "total_listings_count": 3
    }
}
```

##### Fetch Single

**Method**: `GET`
**URL**: `{{localUrl}}/generic/categories/:slug`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "category": {
            "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Phones & Tablets",
            "slug": "phones-tablets",
            "icon": "smartphone",
            "sort_order": 3,
            "listings_count": 2,
            "image_url": null
        }
    }
}
```

#### Product

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/generic/products?filter[brand]=apple`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "products": [],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 0,
            "last_page": 1
        }
    }
}
```

##### Fetch One (By Slug)

**Method**: `GET`
**URL**: `{{localUrl}}/generic/products/slug/:slug`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "product": {
            "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
            "name": "Iphone 13 pro max",
            "slug": "iphone-13-pro-max",
            "brand": "apple",
            "price": 490000,
            "currency": "NGN",
            "location": "Lagos",
            "in_stock": true,
            "rating_average": null,
            "reviews_count": 0,
            "is_featured": false,
            "is_nationwide_delivery": false,
            "is_authentic_only": true,
            "images": [
                {
                    "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                    "sort_order": 1,
                    "is_primary": true
                }
            ],
            "seller": {
                "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "shop_name": "Cybervilla",
                "slug": "cybervilla"
            },
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": "A good phone for your everyday activities.",
            "specifications": [
                "Storage => 512GB"
            ],
            "delivery_estimate": "3 - 5 days"
        },
        "comparable_products": [
            {
                "id": "019e8336-d9da-725c-b2bd-9720a5e19362",
                "name": "Apple Iphone 13 pro max",
                "slug": "apple-iphone-13-pro-max",
                "brand": "apple",
                "price": 900000,
                "currency": "NGN",
                "location": "Lagos",
                "in_stock": true,
                "rating_average": null,
                "reviews_count": 0,
                "is_featured": false,
                "is_nationwide_delivery": false,
                "is_authentic_only": true,
                "images": [
                    {
                        "url": "https://banex-marketplace-api.test/storage/products/019e8336-d9da-725c-b2bd-9720a5e19362/0c1c718b-f440-4ac7-9294-ed910e5e160e.webp",
                        "sort_order": 1,
                        "is_primary": true
                    },
                    {
                        "url": "https://banex-marketplace-api.test/storage/products/019e8336-d9da-725c-b2bd-9720a5e19362/4f6057be-310b-4887-bf44-efac2163a1a8.webp",
                        "sort_order": 2,
                        "is_primary": false
                    }
                ],
                "seller": {
                    "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                    "shop_name": "Cybervilla",
                    "slug": "cybervilla"
                },
                "category": null
            }
        ]
    }
}
```

##### Fetch One (By Id)

**Method**: `GET`
**URL**: `{{localUrl}}/generic/products/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "product": {
            "id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
            "name": "Nike Air Force",
            "slug": "nike-air-force",
            "brand": "Nike",
            "price": 80000,
            "currency": "NGN",
            "location": "Lagos",
            "in_stock": true,
            "rating_average": null,
            "reviews_count": 0,
            "is_featured": false,
            "is_nationwide_delivery": true,
            "is_authentic_only": true,
            "images": [
                {
                    "url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/2d5b1ba4-b341-4430-ab95-9df5823f160b.webp",
                    "sort_order": 1,
                    "is_primary": true
                },
                {
                    "url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/13302374-2d3e-4a93-bc5c-a1c7a70298e6.webp",
                    "sort_order": 2,
                    "is_primary": false
                }
            ],
            "seller": {
                "id": "019e83ac-dea7-72e0-8db6-ae725f0d9a3c",
                "shop_name": "Banex Store",
                "slug": "banex-store"
            },
            "category": {
                "id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
                "name": "Fashion",
                "slug": "fashion",
                "image_url": null
            },
            "description": "A good sneaker",
            "specifications": [
                "Color => White"
            ],
            "delivery_estimate": "1 - 3 days"
        },
        "comparable_products": []
    }
}
```

#### Seller

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/generic/sellers`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "sellers": [
            {
                "id": "019e83ac-dea7-72e0-8db6-ae725f0d9a3c",
                "shop_name": "Banex Store",
                "slug": "banex-store",
                "phone": null,
                "location": null,
                "description": null,
                "listings_count": 1,
                "category": null
            },
            {
                "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "shop_name": "Cybervilla",
                "slug": "cybervilla",
                "phone": "274-993-3544",
                "location": "Langstad Mayotte",
                "description": null,
                "listings_count": 2,
                "category": {
                    "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                    "name": "Phones & Tablets",
                    "slug": "phones-tablets",
                    "image_url": null
                }
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 2,
            "last_page": 1
        }
    }
}
```

##### Fetch One

**Method**: `GET`
**URL**: `{{localUrl}}/generic/sellers/:slug`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "seller": {
            "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "shop_name": "Cybervilla",
            "slug": "cybervilla",
            "phone": "274-993-3544",
            "location": "Langstad Mayotte",
            "description": null,
            "listings_count": 2,
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            }
        },
        "products": [
            {
                "id": "019e8336-d9da-725c-b2bd-9720a5e19362",
                "name": "Apple Iphone 13 pro max",
                "slug": "apple-iphone-13-pro-max",
                "brand": "apple",
                "price": 900000,
                "currency": "NGN",
                "location": "Lagos",
                "in_stock": true,
                "rating_average": null,
                "reviews_count": 0,
                "is_featured": false,
                "is_nationwide_delivery": false,
                "is_authentic_only": true,
                "images": [
                    {
                        "url": "https://banex-marketplace-api.test/storage/products/019e8336-d9da-725c-b2bd-9720a5e19362/0c1c718b-f440-4ac7-9294-ed910e5e160e.webp",
                        "sort_order": 1,
                        "is_primary": true
                    },
                    {
                        "url": "https://banex-marketplace-api.test/storage/products/019e8336-d9da-725c-b2bd-9720a5e19362/4f6057be-310b-4887-bf44-efac2163a1a8.webp",
                        "sort_order": 2,
                        "is_primary": false
                    }
                ],
                "seller": null,
                "category": {
                    "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                    "name": "Phones & Tablets",
                    "slug": "phones-tablets",
                    "image_url": null
                }
            },
            {
                "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
                "name": "Iphone 13 pro max",
                "slug": "iphone-13-pro-max",
                "brand": "apple",
                "price": 490000,
                "currency": "NGN",
                "location": "Lagos",
                "in_stock": true,
                "rating_average": null,
                "reviews_count": 0,
                "is_featured": false,
                "is_nationwide_delivery": false,
                "is_authentic_only": true,
                "images": [
                    {
                        "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                        "sort_order": 1,
                        "is_primary": true
                    }
                ],
                "seller": null,
                "category": {
                    "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                    "name": "Phones & Tablets",
                    "slug": "phones-tablets",
                    "image_url": null
                }
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 2,
            "last_page": 1
        }
    }
}
```

#### Homepage

**Method**: `GET`
**URL**: `{{localUrl}}/generic/home`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "categories": [
            {
                "id": "019e87b9-48b7-7394-820b-08b101759710",
                "name": "Vehicles",
                "slug": "vehicles",
                "icon": "car",
                "sort_order": 1,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48c0-710f-ae8c-d681e4820e6e",
                "name": "Property",
                "slug": "property",
                "icon": "house",
                "sort_order": 2,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "icon": "smartphone",
                "sort_order": 3,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48c8-71a7-a997-52c7192827eb",
                "name": "Electronics",
                "slug": "electronics",
                "icon": "laptop",
                "sort_order": 4,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48cd-7297-a005-a7b8ab7f0999",
                "name": "Home & Garden",
                "slug": "home-garden",
                "icon": "sofa",
                "sort_order": 5,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48d4-7056-966e-f39a817d07aa",
                "name": "Fashion",
                "slug": "fashion",
                "icon": "shirt",
                "sort_order": 6,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48d8-7308-a105-7e201627a09b",
                "name": "Health & Beauty",
                "slug": "health-beauty",
                "icon": "sparkles",
                "sort_order": 7,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48de-7218-8613-d3da7abb2df4",
                "name": "Sports & Outdoors",
                "slug": "sports-outdoors",
                "icon": "dumbbell",
                "sort_order": 8,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48e4-730b-9e54-f368edd385c9",
                "name": "Babies & Kids",
                "slug": "babies-kids",
                "icon": "baby",
                "sort_order": 9,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48e8-7399-9a6c-d1c0a197cacd",
                "name": "Pets",
                "slug": "pets",
                "icon": "paw",
                "sort_order": 10,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48eb-70b4-9ab0-b138e3065b10",
                "name": "Food & Agriculture",
                "slug": "food-agriculture",
                "icon": "apple",
                "sort_order": 11,
                "listings_count": 0,
                "image_url": null
            },
            {
                "id": "019e87b9-48f1-7169-b5c6-06c22d0a48eb",
                "name": "Services & Jobs",
                "slug": "services-jobs",
                "icon": "briefcase",
                "sort_order": 12,
                "listings_count": 0,
                "image_url": null
            }
        ],
        "mall_vendors": [
            {
                "id": "019e87b9-4883-72ab-82fe-aff822fec7d9",
                "shop_name": "Banex Store",
                "slug": "banex-store",
                "description": "Official Banex store listings.",
                "cover_image_url": "https://banex-marketplace-api.test/storage/sellers/019e87b9-4883-72ab-82fe-aff822fec7d9/cover-22aae313-85a3-43f3-a088-84a99f7c85c1.png",
                "location": null,
                "tier": "premium",
                "is_kyc_verified": false,
                "is_open": true,
                "rating_average": null,
                "reviews_count": 0,
                "delivery_estimate_minutes": 35,
                "delivery_fee": 1500,
                "delivery_currency": "NGN",
                "whatsapp": "+2349073934379",
                "listings_count": 0,
                "category": null
            },
            {
                "id": "019e87c5-f9ba-7009-bf80-683ffbacbc39",
                "shop_name": "Samsung Store",
                "slug": "samsung-store",
                "description": "A nice shop at banex mall",
                "cover_image_url": "https://banex-marketplace-api.test/storage/sellers/019e87c5-f9ba-7009-bf80-683ffbacbc39/cover-4013f738-3fd3-431d-8bf8-799b2121d3bf.jpeg",
                "location": "Plot 10",
                "tier": "standard",
                "is_kyc_verified": false,
                "is_open": true,
                "rating_average": null,
                "reviews_count": 0,
                "delivery_estimate_minutes": 30,
                "delivery_fee": 4000,
                "delivery_currency": "NGN",
                "whatsapp": "+2349152553978",
                "listings_count": 0,
                "category": {
                    "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                    "name": "Phones & Tablets",
                    "slug": "phones-tablets",
                    "image_url": null
                }
            }
        ],
        "featured_listings": [],
        "popular_listings": []
    }
}
```

### Admin

#### Category

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/admin/categories`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "categories": [
            {
                "id": "019e4ff8-4b7f-7386-a90e-79c90c33c454",
                "name": "Vehicles",
                "slug": "vehicles",
                "icon": "car",
                "sort_order": 1,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:32.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:32.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c39-73c6-af8d-2b36afe13027",
                "name": "Property",
                "slug": "property",
                "icon": "house",
                "sort_order": 2,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c3f-7336-894e-f07fb62f8bc9",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "icon": "smartphone",
                "sort_order": 3,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c45-70af-b982-70913f62f418",
                "name": "Electronics",
                "slug": "electronics",
                "icon": "laptop",
                "sort_order": 4,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c4c-7310-9715-e58dfe46baec",
                "name": "Home & Garden",
                "slug": "home-garden",
                "icon": "sofa",
                "sort_order": 5,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c52-72ef-a50c-8602188399eb",
                "name": "Fashion",
                "slug": "fashion",
                "icon": "shirt",
                "sort_order": 6,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c57-72a6-8aaf-3cd3f0a0d89c",
                "name": "Health & Beauty",
                "slug": "health-beauty",
                "icon": "sparkles",
                "sort_order": 7,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c61-7099-be13-1239a009e0aa",
                "name": "Sports & Outdoors",
                "slug": "sports-outdoors",
                "icon": "dumbbell",
                "sort_order": 8,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c68-73f5-a2a1-7b9d215ea49c",
                "name": "Babies & Kids",
                "slug": "babies-kids",
                "icon": "baby",
                "sort_order": 9,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c6e-7190-9f64-0bb60268a10a",
                "name": "Pets",
                "slug": "pets",
                "icon": "paw",
                "sort_order": 10,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c77-72b8-9a17-825fc121e3c0",
                "name": "Food & Agriculture",
                "slug": "food-agriculture",
                "icon": "apple",
                "sort_order": 11,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            },
            {
                "id": "019e4ff8-4c7e-73ba-94c5-46f5e67a2410",
                "name": "Services & Jobs",
                "slug": "services-jobs",
                "icon": "briefcase",
                "sort_order": 12,
                "is_active": true,
                "listings_count": 0,
                "created_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "updated_at": {
                    "item": "2026-05-22T13:55:33.000000Z"
                },
                "image_url": null
            }
        ],
        "total_listings_count": 0
    }
}
```

##### Store

**Method**: `POST`
**URL**: `{{localUrl}}/admin/categories`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Category created.",
    "data": {
        "category": {
            "id": "019e5f4b-08a9-70fe-bd0e-b80ba6bc94e9",
            "name": "Entertainment",
            "slug": "entertainment",
            "icon": "television",
            "sort_order": 13,
            "is_active": false,
            "listings_count": 0,
            "created_at": {
                "item": "2026-05-25T13:20:13.000000Z"
            },
            "updated_at": {
                "item": "2026-05-25T13:20:13.000000Z"
            },
            "image_url": null
        }
    }
}
```

##### Fetch One

**Method**: `GET`
**URL**: `{{localUrl}}/admin/categories/:categoryId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "category": {
            "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Phones & Tablets",
            "slug": "phones-tablets",
            "icon": "smartphone",
            "sort_order": 3,
            "is_active": true,
            "listings_count": 0,
            "created_at": {
                "item": "2026-05-27T21:49:48.000000Z"
            },
            "updated_at": {
                "item": "2026-05-27T21:49:48.000000Z"
            },
            "image_url": null
        }
    }
}
```

##### Update

**Method**: `PUT`
**URL**: `{{localUrl}}/admin/categories/:categoryId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Category updated.",
    "data": {
        "category": {
            "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Phones & Tablets",
            "slug": "phones-tablets",
            "icon": "smartphone",
            "sort_order": 3,
            "is_active": false,
            "listings_count": 0,
            "created_at": {
                "item": "2026-05-27T21:49:48.000000Z"
            },
            "updated_at": {
                "item": "2026-05-28T23:32:59.000000Z"
            },
            "image_url": null
        }
    }
}
```

##### Delete

**Method**: `DELETE`
**URL**: `{{localUrl}}/admin/categories/:categoryId`


#### Seller

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/admin/sellers`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "sellers": [
            {
                "id": "019e87c5-f9ba-7009-bf80-683ffbacbc39",
                "shop_name": "Samsung Store",
                "slug": "samsung-store",
                "phone": "458-507-5663",
                "location": "Plot 10",
                "category_id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                "category": {
                    "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                    "name": "Phones & Tablets",
                    "slug": "phones-tablets",
                    "image_url": null
                },
                "description": "A nice shop at banex mall",
                "tier": "standard",
                "cover_image_url": null,
                "operating_hours": "Mon-Sun 9:00 - 21:00",
                "floor": "Ground Floor",
                "shop_no": "015",
                "store_location": "Ground Floor \u00b7 015",
                "whatsapp_contact_id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
                "whatsapp_contact": null,
                "delivery_estimate_minutes": 30,
                "delivery_fee": 4000,
                "delivery_currency": "NGN",
                "rating_average": null,
                "reviews_count": 0,
                "status": "approved",
                "rejection_reason": null,
                "products_count": 0,
                "approved_at": {
                    "item": "2026-06-02T10:04:29.000000Z"
                },
                "user": {
                    "id": "019e87b6-a833-7012-bd34-3d8f4fdc1469",
                    "full_name": "David Iraoyah",
                    "email": "iraoyahdavid200@gmail.com"
                }
            },
            {
                "id": "019e87b9-4883-72ab-82fe-aff822fec7d9",
                "shop_name": "Banex Store",
                "slug": "banex-store",
                "phone": null,
                "location": null,
                "category_id": null,
                "category": null,
                "description": "Official Banex store listings.",
                "tier": "standard",
                "cover_image_url": null,
                "operating_hours": "Mon\u2013Sun \u00b7 9:00 \u2013 21:00",
                "floor": "Ground",
                "shop_no": "G-01",
                "store_location": "Ground \u00b7 G-01",
                "whatsapp_contact_id": null,
                "whatsapp_contact": null,
                "delivery_estimate_minutes": 35,
                "delivery_fee": 1500,
                "delivery_currency": "NGN",
                "rating_average": null,
                "reviews_count": 0,
                "status": "approved",
                "rejection_reason": null,
                "products_count": 0,
                "approved_at": {
                    "item": "2026-06-02T09:45:27.000000Z"
                },
                "user": {
                    "id": "019e87b9-4873-7363-972d-a7f3920f9602",
                    "full_name": "Banex Store",
                    "email": "store@banexmall.com"
                }
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 15,
            "total": 2,
            "last_page": 1
        }
    }
}
```

##### Fetch One

**Method**: `GET`
**URL**: `{{localUrl}}/admin/sellers/:seller`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "seller": {
            "id": "019e87c5-f9ba-7009-bf80-683ffbacbc39",
            "shop_name": "Samsung Store",
            "slug": "samsung-store",
            "phone": "458-507-5663",
            "location": "Plot 10",
            "category_id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
            "category": {
                "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": "A nice shop at banex mall",
            "tier": "standard",
            "cover_image_url": null,
            "operating_hours": "Mon-Sun 9:00 - 21:00",
            "floor": "Ground Floor",
            "shop_no": "015",
            "store_location": "Ground Floor \u00b7 015",
            "whatsapp_contact_id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
            "whatsapp_contact": {
                "id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
                "phone_number": "+2349152553978",
                "label": "Banex Store B"
            },
            "delivery_estimate_minutes": 30,
            "delivery_fee": 4000,
            "delivery_currency": "NGN",
            "rating_average": null,
            "reviews_count": 0,
            "status": "approved",
            "rejection_reason": null,
            "products_count": 0,
            "approved_at": {
                "item": "2026-06-02T10:04:29.000000Z"
            },
            "user": {
                "id": "019e87b6-a833-7012-bd34-3d8f4fdc1469",
                "full_name": "David Iraoyah",
                "email": "iraoyahdavid200@gmail.com"
            }
        }
    }
}
```

##### Update

**Method**: `POST`
**URL**: `{{localUrl}}/admin/sellers/:seller`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Seller updated.",
    "data": {
        "seller": {
            "id": "019e87b9-4883-72ab-82fe-aff822fec7d9",
            "shop_name": "Banex Store",
            "slug": "banex-store",
            "phone": null,
            "location": null,
            "category_id": null,
            "category": null,
            "description": "Official Banex store listings.",
            "tier": "premium",
            "cover_image_url": "https://banex-marketplace-api.test/storage/sellers/019e87b9-4883-72ab-82fe-aff822fec7d9/cover-22aae313-85a3-43f3-a088-84a99f7c85c1.png",
            "operating_hours": "Mon\u2013Sun \u00b7 9:00 \u2013 21:00",
            "floor": "Ground",
            "shop_no": "G-01",
            "store_location": "Ground \u00b7 G-01",
            "whatsapp_contact_id": "019e87c2-81f2-7029-820e-d146799d0bc2",
            "whatsapp_contact": {
                "id": "019e87c2-81f2-7029-820e-d146799d0bc2",
                "phone_number": "+2349073934379",
                "label": "Banex Store A"
            },
            "delivery_estimate_minutes": 35,
            "delivery_fee": 1500,
            "delivery_currency": "NGN",
            "rating_average": null,
            "reviews_count": 0,
            "status": "approved",
            "rejection_reason": null,
            "products_count": 0,
            "approved_at": {
                "item": "2026-06-02T09:45:27.000000Z"
            },
            "user": {
                "id": "019e87b9-4873-7363-972d-a7f3920f9602",
                "full_name": "Banex Store",
                "email": "store@banexmall.com"
            }
        }
    }
}
```

##### Approve

**Method**: `POST`
**URL**: `{{localUrl}}/admin/sellers/:seller/approve`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Seller approved.",
    "data": {
        "seller": {
            "id": "019e87c5-f9ba-7009-bf80-683ffbacbc39",
            "shop_name": "Samsung Store",
            "slug": "samsung-store",
            "phone": "458-507-5663",
            "location": "Plot 10",
            "category_id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
            "category": {
                "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": "A nice shop at banex mall",
            "cover_image_url": null,
            "operating_hours": "Mon-Sun 9:00 - 21:00",
            "floor": "Ground Floor",
            "shop_no": "015",
            "store_location": "Ground Floor \u00b7 015",
            "whatsapp_contact_id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
            "whatsapp_contact": {
                "id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
                "phone_number": "+2349152553978",
                "label": "Banex Store B",
                "is_active": true,
                "sellers_count": 0,
                "created_at": {
                    "item": "2026-06-02T09:56:27.000000Z"
                },
                "updated_at": {
                    "item": "2026-06-02T09:56:27.000000Z"
                }
            },
            "delivery_estimate_minutes": 30,
            "delivery_fee": 4000,
            "delivery_currency": "NGN",
            "rating_average": null,
            "reviews_count": 0,
            "status": "approved",
            "rejection_reason": null,
            "products_count": 0,
            "approved_at": {
                "item": "2026-06-02T10:04:29.000000Z"
            },
            "created_at": {
                "item": "2026-06-02T09:59:19.000000Z"
            },
            "updated_at": {
                "item": "2026-06-02T10:04:29.000000Z"
            },
            "user": {
                "id": "019e87b6-a833-7012-bd34-3d8f4fdc1469",
                "full_name": "David Iraoyah",
                "email": "iraoyahdavid200@gmail.com"
            }
        }
    }
}
```

##### Reject

**Method**: `POST`
**URL**: `{{localUrl}}/admin/sellers/:seller/reject`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Seller application rejected.",
    "data": {
        "seller": {
            "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "shop_name": "Cybervilla",
            "slug": "cybervilla",
            "phone": "274-993-3544",
            "location": "Langstad Mayotte",
            "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": null,
            "status": "rejected",
            "rejection_reason": "Wrong seller information.",
            "products_count": 0,
            "approved_at": null,
            "created_at": {
                "item": "2026-05-27T22:03:08.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T09:59:17.000000Z"
            },
            "user": {
                "id": "019e63b9-924c-70be-a845-95a28c62934b",
                "full_name": "David Iraoyah",
                "email": "iraoyahdavid200@gmail.com"
            }
        }
    }
}
```

##### Suspend

**Method**: `POST`
**URL**: `{{localUrl}}/admin/sellers/:seller/suspend`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Seller suspended.",
    "data": {
        "seller": {
            "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "shop_name": "Cybervilla",
            "slug": "cybervilla",
            "phone": "274-993-3544",
            "location": "Langstad Mayotte",
            "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": null,
            "status": "suspended",
            "rejection_reason": "Wrong seller information.",
            "products_count": 0,
            "approved_at": null,
            "created_at": {
                "item": "2026-05-27T22:03:08.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T10:01:21.000000Z"
            },
            "user": {
                "id": "019e63b9-924c-70be-a845-95a28c62934b",
                "full_name": "David Iraoyah",
                "email": "iraoyahdavid200@gmail.com"
            }
        }
    }
}
```

#### Product

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/admin/products?trashed=with&filter[seller_id]=019e6b76-7e48-70fc-aa8a-ca8ea9db907d`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "products": [
            {
                "id": "019e8336-d9da-725c-b2bd-9720a5e19362",
                "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Apple Iphone 13 pro max",
                "slug": "apple-iphone-13-pro-max",
                "brand": "apple",
                "description": "A good phone for your everyday activities.",
                "specifications": [
                    "Storage => 512GB"
                ],
                "price": 480000,
                "currency": "NGN",
                "location": "Lagos",
                "delivery_estimate": "3 - 5 days",
                "rating_average": null,
                "reviews_count": 0,
                "is_escrow_enabled": true,
                "is_nationwide_delivery": false,
                "is_authentic_only": true,
                "is_featured": false,
                "status": "pending",
                "rejection_reason": null,
                "approved_at": null,
                "deleted_at": {
                    "item": "2026-06-01T12:44:54.000000Z"
                },
                "created_at": {
                    "item": "2026-06-01T12:44:30.000000Z"
                },
                "updated_at": {
                    "item": "2026-06-01T12:44:54.000000Z"
                },
                "images": [
                    {
                        "id": "019e8336-d9ef-71fa-8df8-4861bf8e575e",
                        "url": "https://banex-marketplace-api.test/storage/products/019e8336-d9da-725c-b2bd-9720a5e19362/0c1c718b-f440-4ac7-9294-ed910e5e160e.webp",
                        "sort_order": 1,
                        "is_primary": true,
                        "created_at": {
                            "item": "2026-06-01T12:44:30.000000Z"
                        }
                    },
                    {
                        "id": "019e8336-d9f5-7393-b13a-9358ca033cda",
                        "url": "https://banex-marketplace-api.test/storage/products/019e8336-d9da-725c-b2bd-9720a5e19362/4f6057be-310b-4887-bf44-efac2163a1a8.webp",
                        "sort_order": 2,
                        "is_primary": false,
                        "created_at": {
                            "item": "2026-06-01T12:44:30.000000Z"
                        }
                    }
                ],
                "seller": {
                    "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                    "shop_name": "Cybervilla",
                    "slug": "cybervilla"
                },
                "category": {
                    "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                    "name": "Phones & Tablets",
                    "slug": "phones-tablets",
                    "image_url": null
                }
            },
            {
                "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
                "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Iphone 13 pro max",
                "slug": "iphone-13-pro-max",
                "brand": "apple",
                "description": "A good phone for your everyday activities.",
                "specifications": [
                    "Storage => 512GB"
                ],
                "price": 490000,
                "currency": "NGN",
                "location": "Lagos",
                "delivery_estimate": "3 - 5 days",
                "rating_average": null,
                "reviews_count": 0,
                "is_escrow_enabled": true,
                "is_nationwide_delivery": false,
                "is_authentic_only": true,
                "is_featured": false,
                "status": "pending",
                "rejection_reason": null,
                "approved_at": null,
                "deleted_at": null,
                "created_at": {
                    "item": "2026-06-01T11:24:47.000000Z"
                },
                "updated_at": {
                    "item": "2026-06-01T12:39:31.000000Z"
                },
                "images": [
                    {
                        "id": "019e82ed-dd48-710f-9227-57680b7e8d63",
                        "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                        "sort_order": 1,
                        "is_primary": true,
                        "created_at": {
                            "item": "2026-06-01T11:24:47.000000Z"
                        }
                    }
                ],
                "seller": {
                    "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                    "shop_name": "Cybervilla",
                    "slug": "cybervilla"
                },
                "category": {
                    "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                    "name": "Phones & Tablets",
                    "slug": "phones-tablets",
                    "image_url": null
                }
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 15,
            "total": 2,
            "last_page": 1
        }
    }
}
```

##### Fetch One

**Method**: `GET`
**URL**: `{{localUrl}}/admin/products/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "product": {
            "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
            "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Iphone 13 pro max",
            "slug": "iphone-13-pro-max",
            "brand": "apple",
            "description": "A good phone for your everyday activities.",
            "specifications": [
                "Storage => 512GB"
            ],
            "price": 490000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "3 - 5 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": false,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "pending",
            "rejection_reason": null,
            "approved_at": null,
            "deleted_at": null,
            "created_at": {
                "item": "2026-06-01T11:24:47.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T12:39:31.000000Z"
            },
            "images": [
                {
                    "id": "019e82ed-dd48-710f-9227-57680b7e8d63",
                    "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T11:24:47.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "shop_name": "Cybervilla",
                "slug": "cybervilla"
            },
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            }
        }
    }
}
```

##### Store

**Method**: `POST`
**URL**: `{{localUrl}}/admin/products`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Draft product created.",
    "data": {
        "product": {
            "id": "019e837f-472c-7350-b740-88e650dff913",
            "seller_id": "019e835e-299c-71c7-8df6-7e6135029fa4",
            "category_id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
            "name": "Nike Air Force",
            "slug": "nike-air-force",
            "brand": "Nike",
            "description": "A good sneaker",
            "specifications": [
                "Color => White"
            ],
            "price": 80000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "1 - 3 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": true,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "draft",
            "rejection_reason": null,
            "approved_at": null,
            "deleted_at": null,
            "created_at": {
                "item": "2026-06-01T14:03:37.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T14:03:37.000000Z"
            },
            "images": [
                {
                    "id": "019e837f-4752-707f-823a-c4155f512b27",
                    "url": "https://banex-marketplace-api.test/storage/products/019e837f-472c-7350-b740-88e650dff913/ad996ca4-290f-4bcf-9acb-f23434c6ab90.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T14:03:37.000000Z"
                    }
                },
                {
                    "id": "019e837f-4759-73aa-9896-7d2e4a17ae30",
                    "url": "https://banex-marketplace-api.test/storage/products/019e837f-472c-7350-b740-88e650dff913/a876ac9e-506f-47e6-a1f9-53e208101fc3.webp",
                    "sort_order": 2,
                    "is_primary": false,
                    "created_at": {
                        "item": "2026-06-01T14:03:37.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e835e-299c-71c7-8df6-7e6135029fa4",
                "shop_name": "Banex Store",
                "slug": "banex-store"
            },
            "category": {
                "id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
                "name": "Fashion",
                "slug": "fashion",
                "image_url": null
            }
        }
    }
}
```

##### Update

**Method**: `POST`
**URL**: `{{localUrl}}/admin/products/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product updated.",
    "data": {
        "product": {
            "id": "019e837f-472c-7350-b740-88e650dff913",
            "seller_id": "019e835e-299c-71c7-8df6-7e6135029fa4",
            "category_id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
            "name": "Nike Air Force",
            "slug": "nike-air-force",
            "brand": "Nike",
            "description": "A good sneaker",
            "specifications": [
                "Color => White"
            ],
            "price": 80000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "1 - 3 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": true,
            "is_authentic_only": true,
            "is_featured": true,
            "status": "draft",
            "rejection_reason": null,
            "approved_at": null,
            "deleted_at": null,
            "created_at": {
                "item": "2026-06-01T14:03:37.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T14:38:12.000000Z"
            },
            "images": [
                {
                    "id": "019e837f-4752-707f-823a-c4155f512b27",
                    "url": "https://banex-marketplace-api.test/storage/products/019e837f-472c-7350-b740-88e650dff913/ad996ca4-290f-4bcf-9acb-f23434c6ab90.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T14:03:37.000000Z"
                    }
                },
                {
                    "id": "019e837f-4759-73aa-9896-7d2e4a17ae30",
                    "url": "https://banex-marketplace-api.test/storage/products/019e837f-472c-7350-b740-88e650dff913/a876ac9e-506f-47e6-a1f9-53e208101fc3.webp",
                    "sort_order": 2,
                    "is_primary": false,
                    "created_at": {
                        "item": "2026-06-01T14:03:37.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e835e-299c-71c7-8df6-7e6135029fa4",
                "shop_name": "Banex Store",
                "slug": "banex-store"
            },
            "category": {
                "id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
                "name": "Fashion",
                "slug": "fashion",
                "image_url": null
            }
        }
    }
}
```

##### Activate

**Method**: `POST`
**URL**: `{{localUrl}}/admin/products/:productId/activate`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product activated.",
    "data": {
        "product": {
            "id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
            "seller_id": "019e83ac-dea7-72e0-8db6-ae725f0d9a3c",
            "category_id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
            "name": "Nike Air Force",
            "slug": "nike-air-force",
            "brand": "Nike",
            "description": "A good sneaker",
            "specifications": [
                "Color => White"
            ],
            "price": 80000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "1 - 3 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": true,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "active",
            "rejection_reason": null,
            "approved_at": {
                "item": "2026-06-01T14:55:18.000000Z"
            },
            "deleted_at": null,
            "created_at": {
                "item": "2026-06-01T14:53:25.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T14:55:18.000000Z"
            },
            "images": [
                {
                    "id": "019e83ac-dede-729d-b651-3b341ca757d6",
                    "url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/2d5b1ba4-b341-4430-ab95-9df5823f160b.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T14:53:25.000000Z"
                    }
                },
                {
                    "id": "019e83ac-dee2-70c6-84c9-43631a369e85",
                    "url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/13302374-2d3e-4a93-bc5c-a1c7a70298e6.webp",
                    "sort_order": 2,
                    "is_primary": false,
                    "created_at": {
                        "item": "2026-06-01T14:53:25.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e83ac-dea7-72e0-8db6-ae725f0d9a3c",
                "shop_name": "Banex Store",
                "slug": "banex-store"
            },
            "category": {
                "id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
                "name": "Fashion",
                "slug": "fashion",
                "image_url": null
            }
        }
    }
}
```

##### Deactivate

**Method**: `POST`
**URL**: `{{localUrl}}/admin/products/:productId/deactivate`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product deactivated.",
    "data": {
        "product": {
            "id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
            "seller_id": "019e83ac-dea7-72e0-8db6-ae725f0d9a3c",
            "category_id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
            "name": "Nike Air Force",
            "slug": "nike-air-force",
            "brand": "Nike",
            "description": "A good sneaker",
            "specifications": [
                "Color => White"
            ],
            "price": 80000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "1 - 3 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": true,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "inactive",
            "rejection_reason": null,
            "approved_at": {
                "item": "2026-06-01T14:55:18.000000Z"
            },
            "deleted_at": null,
            "created_at": {
                "item": "2026-06-01T14:53:25.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T14:58:13.000000Z"
            },
            "images": [
                {
                    "id": "019e83ac-dede-729d-b651-3b341ca757d6",
                    "url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/2d5b1ba4-b341-4430-ab95-9df5823f160b.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T14:53:25.000000Z"
                    }
                },
                {
                    "id": "019e83ac-dee2-70c6-84c9-43631a369e85",
                    "url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/13302374-2d3e-4a93-bc5c-a1c7a70298e6.webp",
                    "sort_order": 2,
                    "is_primary": false,
                    "created_at": {
                        "item": "2026-06-01T14:53:25.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e83ac-dea7-72e0-8db6-ae725f0d9a3c",
                "shop_name": "Banex Store",
                "slug": "banex-store"
            },
            "category": {
                "id": "019e6b6a-4b51-722b-932a-ead031d2b0ce",
                "name": "Fashion",
                "slug": "fashion",
                "image_url": null
            }
        }
    }
}
```

##### Approved

**Method**: `POST`
**URL**: `{{localUrl}}/admin/products/:productId/approve`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product approved.",
    "data": {
        "product": {
            "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
            "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Iphone 13 pro max",
            "slug": "iphone-13-pro-max",
            "brand": "apple",
            "description": "A good phone for your everyday activities.",
            "specifications": [
                "Storage => 512GB"
            ],
            "price": 490000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "3 - 5 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": false,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "active",
            "rejection_reason": null,
            "approved_at": {
                "item": "2026-06-01T14:59:20.000000Z"
            },
            "deleted_at": null,
            "created_at": {
                "item": "2026-06-01T11:24:47.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T14:59:20.000000Z"
            },
            "images": [
                {
                    "id": "019e82ed-dd48-710f-9227-57680b7e8d63",
                    "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T11:24:47.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "shop_name": "Cybervilla",
                "slug": "cybervilla"
            },
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            }
        }
    }
}
```

##### Reject

**Method**: `POST`
**URL**: `{{localUrl}}/admin/products/:productId/reject`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product rejected.",
    "data": {
        "product": {
            "id": "019e8336-d9da-725c-b2bd-9720a5e19362",
            "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Apple Iphone 13 pro max",
            "slug": "apple-iphone-13-pro-max",
            "brand": "apple",
            "description": "A good phone for your everyday activities.",
            "specifications": [
                "Storage => 512GB"
            ],
            "price": 480000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "3 - 5 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": false,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "rejected",
            "rejection_reason": "Duplicate product. Revert if rejection was a mistake.",
            "approved_at": null,
            "deleted_at": null,
            "created_at": {
                "item": "2026-06-01T12:44:30.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T15:03:13.000000Z"
            },
            "images": [
                {
                    "id": "019e8336-d9ef-71fa-8df8-4861bf8e575e",
                    "url": "https://banex-marketplace-api.test/storage/products/019e8336-d9da-725c-b2bd-9720a5e19362/0c1c718b-f440-4ac7-9294-ed910e5e160e.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T12:44:30.000000Z"
                    }
                },
                {
                    "id": "019e8336-d9f5-7393-b13a-9358ca033cda",
                    "url": "https://banex-marketplace-api.test/storage/products/019e8336-d9da-725c-b2bd-9720a5e19362/4f6057be-310b-4887-bf44-efac2163a1a8.webp",
                    "sort_order": 2,
                    "is_primary": false,
                    "created_at": {
                        "item": "2026-06-01T12:44:30.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "shop_name": "Cybervilla",
                "slug": "cybervilla"
            },
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            }
        }
    }
}
```

#### WhatsApp Contacts

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/admin/whatsapp-contacts`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "whatsapp_contacts": [
            {
                "id": "019e87c2-81f2-7029-820e-d146799d0bc2",
                "phone_number": "+2349073934379",
                "label": "Banex Store A",
                "is_active": true,
                "sellers_count": 0,
                "created_at": {
                    "item": "2026-06-02T09:55:31.000000Z"
                },
                "updated_at": {
                    "item": "2026-06-02T09:55:31.000000Z"
                }
            }
        ]
    }
}
```

##### Store

**Method**: `POST`
**URL**: `{{localUrl}}/admin/whatsapp-contacts`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "WhatsApp contact added.",
    "data": {
        "whatsapp_contact": {
            "id": "019e87c2-81f2-7029-820e-d146799d0bc2",
            "phone_number": "+2349073934379",
            "label": "Banex Store A",
            "is_active": true,
            "sellers_count": 0,
            "created_at": {
                "item": "2026-06-02T09:55:31.000000Z"
            },
            "updated_at": {
                "item": "2026-06-02T09:55:31.000000Z"
            }
        }
    }
}
```

##### Update

**Method**: `PUT`
**URL**: `{{localUrl}}/admin/whatsapp-contacts/:contactId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "WhatsApp contact updated.",
    "data": {
        "whatsapp_contact": {
            "id": "019e87c2-81f2-7029-820e-d146799d0bc2",
            "phone_number": "+2349073934379",
            "label": "Banex Store A",
            "is_active": true,
            "sellers_count": 0,
            "created_at": {
                "item": "2026-06-02T09:55:31.000000Z"
            },
            "updated_at": {
                "item": "2026-06-02T09:55:31.000000Z"
            }
        }
    }
}
```

##### Delete

**Method**: `DELETE`
**URL**: `{{localUrl}}/admin/whatsapp-contacts/:contactId`


### User

#### Seller

##### Product

###### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/seller/products`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "products": [
            {
                "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
                "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Apple Iphone 13 pro max",
                "slug": "apple-iphone-13-pro-max",
                "brand": "apple",
                "description": "A good phone for your everyday activities.",
                "specifications": [
                    "Storage => 512GB"
                ],
                "price": 480000,
                "currency": "NGN",
                "location": "Lagos",
                "delivery_estimate": "3 - 5 days",
                "rating_average": null,
                "reviews_count": 0,
                "is_escrow_enabled": true,
                "is_nationwide_delivery": false,
                "is_authentic_only": true,
                "is_featured": false,
                "status": "pending",
                "rejection_reason": null,
                "approved_at": null,
                "created_at": {
                    "item": "2026-06-01T11:24:47.000000Z"
                },
                "updated_at": {
                    "item": "2026-06-01T11:24:47.000000Z"
                },
                "images": [
                    {
                        "id": "019e82ed-dd48-710f-9227-57680b7e8d63",
                        "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                        "sort_order": 1,
                        "is_primary": true,
                        "created_at": {
                            "item": "2026-06-01T11:24:47.000000Z"
                        }
                    },
                    {
                        "id": "019e82ed-dd53-7097-8e8e-a7271bcc9006",
                        "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/0948e196-7546-4366-ad76-f23afc0ca4f1.webp",
                        "sort_order": 2,
                        "is_primary": false,
                        "created_at": {
                            "item": "2026-06-01T11:24:47.000000Z"
                        }
                    }
                ],
                "seller": {
                    "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                    "shop_name": "Cybervilla",
                    "slug": "cybervilla"
                },
                "category": {
                    "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                    "name": "Phones & Tablets",
                    "slug": "phones-tablets",
                    "image_url": null
                }
            }
        ]
    }
}
```

###### Store

**Method**: `POST`
**URL**: `{{localUrl}}/seller/products`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product submitted for review.",
    "data": {
        "product": {
            "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
            "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Apple Iphone 13 pro max",
            "slug": "apple-iphone-13-pro-max",
            "brand": "apple",
            "description": "A good phone for your everyday activities.",
            "specifications": [
                "Storage => 512GB"
            ],
            "price": 480000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "3 - 5 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": false,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "pending",
            "rejection_reason": null,
            "approved_at": null,
            "created_at": {
                "item": "2026-06-01T11:24:47.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T11:24:47.000000Z"
            },
            "images": [
                {
                    "id": "019e82ed-dd48-710f-9227-57680b7e8d63",
                    "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T11:24:47.000000Z"
                    }
                },
                {
                    "id": "019e82ed-dd53-7097-8e8e-a7271bcc9006",
                    "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/0948e196-7546-4366-ad76-f23afc0ca4f1.webp",
                    "sort_order": 2,
                    "is_primary": false,
                    "created_at": {
                        "item": "2026-06-01T11:24:47.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "shop_name": "Cybervilla",
                "slug": "cybervilla"
            },
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            }
        }
    }
}
```

###### Update

**Method**: `POST`
**URL**: `{{localUrl}}/seller/products/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product updated and submitted for review.",
    "data": {
        "product": {
            "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
            "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Iphone 13 pro max",
            "slug": "iphone-13-pro-max",
            "brand": "apple",
            "description": "A good phone for your everyday activities.",
            "specifications": [
                "Storage => 512GB"
            ],
            "price": 490000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "3 - 5 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": false,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "pending",
            "rejection_reason": null,
            "approved_at": null,
            "created_at": {
                "item": "2026-06-01T11:24:47.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T12:39:31.000000Z"
            },
            "images": [
                {
                    "id": "019e82ed-dd48-710f-9227-57680b7e8d63",
                    "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T11:24:47.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "shop_name": "Cybervilla",
                "slug": "cybervilla"
            },
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            }
        }
    }
}
```

###### Fetch One

**Method**: `GET`
**URL**: `{{localUrl}}/seller/products/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "product": {
            "id": "019e82ed-dd25-7169-82e6-2f428e4d47dc",
            "seller_id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
            "category_id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
            "name": "Apple Iphone 13 pro max",
            "slug": "apple-iphone-13-pro-max",
            "brand": "apple",
            "description": "A good phone for your everyday activities.",
            "specifications": [
                "Storage => 512GB"
            ],
            "price": 480000,
            "currency": "NGN",
            "location": "Lagos",
            "delivery_estimate": "3 - 5 days",
            "rating_average": null,
            "reviews_count": 0,
            "is_escrow_enabled": true,
            "is_nationwide_delivery": false,
            "is_authentic_only": true,
            "is_featured": false,
            "status": "pending",
            "rejection_reason": null,
            "approved_at": null,
            "created_at": {
                "item": "2026-06-01T11:24:47.000000Z"
            },
            "updated_at": {
                "item": "2026-06-01T11:24:47.000000Z"
            },
            "images": [
                {
                    "id": "019e82ed-dd48-710f-9227-57680b7e8d63",
                    "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/eae9e20a-fe65-4376-bea8-a372c5c36004.webp",
                    "sort_order": 1,
                    "is_primary": true,
                    "created_at": {
                        "item": "2026-06-01T11:24:47.000000Z"
                    }
                },
                {
                    "id": "019e82ed-dd53-7097-8e8e-a7271bcc9006",
                    "url": "https://banex-marketplace-api.test/storage/products/019e82ed-dd25-7169-82e6-2f428e4d47dc/0948e196-7546-4366-ad76-f23afc0ca4f1.webp",
                    "sort_order": 2,
                    "is_primary": false,
                    "created_at": {
                        "item": "2026-06-01T11:24:47.000000Z"
                    }
                }
            ],
            "seller": {
                "id": "019e6b76-7e48-70fc-aa8a-ca8ea9db907d",
                "shop_name": "Cybervilla",
                "slug": "cybervilla"
            },
            "category": {
                "id": "019e6b6a-4b40-73ca-9d1e-bc924c49e3b3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            }
        }
    }
}
```

###### Delete

**Method**: `DELETE`
**URL**: `{{localUrl}}/seller/products/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product deleted.",
    "data": null
}
```

##### Apply (Become a seller)

**Method**: `POST`
**URL**: `{{localUrl}}/seller/apply`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Seller application submitted. You will be notified once it is reviewed.",
    "data": {
        "seller": {
            "id": "019e87c5-f9ba-7009-bf80-683ffbacbc39",
            "shop_name": "Samsung Store",
            "slug": "samsung-store",
            "phone": "458-507-5663",
            "location": "Plot 10",
            "category_id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
            "category": {
                "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": "A nice shop at banex mall",
            "cover_image_url": null,
            "operating_hours": "Mon-Sun 9:00 - 21:00",
            "floor": "Ground Floor",
            "shop_no": "015",
            "store_location": "Ground Floor \u00b7 015",
            "whatsapp_contact_id": null,
            "whatsapp_contact": null,
            "delivery_estimate_minutes": 30,
            "delivery_fee": 4000,
            "delivery_currency": null,
            "rating_average": null,
            "reviews_count": 0,
            "status": "pending",
            "rejection_reason": null,
            "products_count": 0,
            "approved_at": null,
            "created_at": {
                "item": "2026-06-02T09:59:19.000000Z"
            },
            "updated_at": {
                "item": "2026-06-02T09:59:19.000000Z"
            }
        }
    }
}
```

##### Fetch Application

**Method**: `GET`
**URL**: `{{localUrl}}/seller/application`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "seller": {
            "id": "019e87c5-f9ba-7009-bf80-683ffbacbc39",
            "shop_name": "Samsung Store",
            "slug": "samsung-store",
            "phone": "458-507-5663",
            "location": "Plot 10",
            "category_id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
            "category": {
                "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": "A nice shop at banex mall",
            "cover_image_url": null,
            "operating_hours": "Mon-Sun 9:00 - 21:00",
            "floor": "Ground Floor",
            "shop_no": "015",
            "store_location": "Ground Floor \u00b7 015",
            "whatsapp_contact_id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
            "whatsapp_contact": {
                "id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
                "phone_number": "+2349152553978",
                "label": "Banex Store B"
            },
            "delivery_estimate_minutes": 30,
            "delivery_fee": 4000,
            "delivery_currency": "NGN",
            "rating_average": null,
            "reviews_count": 0,
            "status": "approved",
            "rejection_reason": null,
            "products_count": 0,
            "approved_at": {
                "item": "2026-06-02T10:04:29.000000Z"
            }
        }
    }
}
```

##### Profile

**Method**: `POST`
**URL**: `{{localUrl}}/seller/profile`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Shop profile updated.",
    "data": {
        "seller": {
            "id": "019e87c5-f9ba-7009-bf80-683ffbacbc39",
            "shop_name": "Samsung Store",
            "slug": "samsung-store",
            "phone": "458-507-5663",
            "location": "Plot 10",
            "category_id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
            "category": {
                "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": "A nice shop at banex mall",
            "tier": "standard",
            "cover_image_url": null,
            "operating_hours": "Mon-Sun 9:00 - 21:00",
            "floor": "Ground Floor",
            "shop_no": "015",
            "store_location": "Ground Floor \u00b7 015",
            "whatsapp_contact_id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
            "whatsapp_contact": null,
            "delivery_estimate_minutes": 30,
            "delivery_fee": 4000,
            "delivery_currency": "NGN",
            "rating_average": null,
            "reviews_count": 0,
            "status": "approved",
            "rejection_reason": null,
            "products_count": 0,
            "approved_at": {
                "item": "2026-06-02T10:04:29.000000Z"
            }
        }
    }
}
```

*Success 2* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Shop profile updated.",
    "data": {
        "seller": {
            "id": "019e87c5-f9ba-7009-bf80-683ffbacbc39",
            "shop_name": "Samsung Store",
            "slug": "samsung-store",
            "phone": "458-507-5663",
            "location": "Plot 10",
            "category_id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
            "category": {
                "id": "019e87b9-48c4-7060-a0c7-65062c5062e3",
                "name": "Phones & Tablets",
                "slug": "phones-tablets",
                "image_url": null
            },
            "description": "A nice shop at banex mall",
            "tier": "standard",
            "cover_image_url": "https://banex-marketplace-api.test/storage/sellers/019e87c5-f9ba-7009-bf80-683ffbacbc39/cover-4013f738-3fd3-431d-8bf8-799b2121d3bf.jpeg",
            "operating_hours": "Mon-Sun 9:00 - 21:00",
            "floor": "Ground Floor",
            "shop_no": "015",
            "store_location": "Ground Floor \u00b7 015",
            "whatsapp_contact_id": "019e87c3-5a69-70f3-a2b4-1e4fcfd0107f",
            "whatsapp_contact": null,
            "delivery_estimate_minutes": 30,
            "delivery_fee": 4000,
            "delivery_currency": "NGN",
            "rating_average": null,
            "reviews_count": 0,
            "status": "approved",
            "rejection_reason": null,
            "products_count": 0,
            "approved_at": {
                "item": "2026-06-02T10:04:29.000000Z"
            }
        }
    }
}
```

#### Wishlist

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/user/wishlist`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "wishlist": [
            {
                "id": "019e83cb-8561-735a-ad93-3b57bc6cbbfc",
                "product_id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                "created_at": {
                    "item": "2026-06-01T15:26:53.000000Z"
                }
            }
        ]
    }
}
```

##### Store

**Method**: `POST`
**URL**: `{{localUrl}}/user/wishlist`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product added to wishlist.",
    "data": {
        "item": {
            "id": "019e83ae-cc72-71b5-9432-185be168fb98",
            "product_id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
            "created_at": {
                "item": "2026-06-01T14:55:31.000000Z"
            }
        }
    }
}
```

##### Sync

**Method**: `POST`
**URL**: `{{localUrl}}/user/wishlist/sync`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Wishlist synced.",
    "data": {
        "wishlist": [
            {
                "id": "019e83ae-cc72-71b5-9432-185be168fb98",
                "product_id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                "created_at": {
                    "item": "2026-06-01T14:55:31.000000Z"
                }
            }
        ]
    }
}
```

##### Delete

**Method**: `DELETE`
**URL**: `{{localUrl}}/user/wishlist/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Product removed from wishlist.",
    "data": null
}
```

#### Cart

##### Fetch All

**Method**: `GET`
**URL**: `{{localUrl}}/user/cart`


##### Store

**Method**: `POST`
**URL**: `{{localUrl}}/user/cart/items`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Added to cart.",
    "data": {
        "cart": {
            "id": "019e83cc-4cce-737e-9d0d-2f4b18b80106",
            "user_id": "019e63b9-924c-70be-a845-95a28c62934b",
            "items": [
                {
                    "id": "019e83d1-9f06-704d-b92e-0dbc2225c33c",
                    "product_id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                    "quantity": 3,
                    "unit_price": 80000,
                    "line_total": 240000,
                    "product": {
                        "id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                        "name": "Nike Air Force",
                        "currency": "NGN",
                        "price": 80000,
                        "primary_image_url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/2d5b1ba4-b341-4430-ab95-9df5823f160b.webp"
                    },
                    "created_at": {
                        "item": "2026-06-01T15:33:33.000000Z"
                    }
                }
            ],
            "summary": {
                "items_count": 3,
                "subtotal": 240000,
                "currency": "NGN"
            },
            "updated_at": {
                "item": "2026-06-01T15:27:44.000000Z"
            }
        }
    }
}
```

##### Update

**Method**: `PUT`
**URL**: `{{localUrl}}/user/cart/items/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Cart updated.",
    "data": {
        "cart": {
            "id": "019e83cc-4cce-737e-9d0d-2f4b18b80106",
            "user_id": "019e63b9-924c-70be-a845-95a28c62934b",
            "items": [
                {
                    "id": "019e83d1-9f06-704d-b92e-0dbc2225c33c",
                    "product_id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                    "quantity": 3,
                    "unit_price": 80000,
                    "line_total": 240000,
                    "product": {
                        "id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                        "name": "Nike Air Force",
                        "currency": "NGN",
                        "price": 80000,
                        "primary_image_url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/2d5b1ba4-b341-4430-ab95-9df5823f160b.webp"
                    },
                    "created_at": {
                        "item": "2026-06-01T15:33:33.000000Z"
                    }
                }
            ],
            "summary": {
                "items_count": 3,
                "subtotal": 240000,
                "currency": "NGN"
            },
            "updated_at": {
                "item": "2026-06-01T15:27:44.000000Z"
            }
        }
    }
}
```

##### Sync

**Method**: `POST`
**URL**: `{{localUrl}}/user/cart/sync`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Cart synced.",
    "data": {
        "cart": {
            "id": "019e83cc-4cce-737e-9d0d-2f4b18b80106",
            "user_id": "019e63b9-924c-70be-a845-95a28c62934b",
            "items": [
                {
                    "id": "019e83dc-5d47-715d-9677-5cf05341d4f9",
                    "product_id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                    "quantity": 4,
                    "unit_price": 80000,
                    "line_total": 320000,
                    "product": {
                        "id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                        "name": "Nike Air Force",
                        "currency": "NGN",
                        "price": 80000,
                        "primary_image_url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/2d5b1ba4-b341-4430-ab95-9df5823f160b.webp"
                    },
                    "created_at": {
                        "item": "2026-06-01T15:45:17.000000Z"
                    }
                }
            ],
            "summary": {
                "items_count": 4,
                "subtotal": 320000,
                "currency": "NGN"
            },
            "updated_at": {
                "item": "2026-06-01T15:27:44.000000Z"
            }
        }
    }
}
```

##### Delete

**Method**: `DELETE`
**URL**: `{{localUrl}}/user/cart/items/:productId`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Removed from cart.",
    "data": {
        "cart": {
            "id": "019e83cc-4cce-737e-9d0d-2f4b18b80106",
            "user_id": "019e63b9-924c-70be-a845-95a28c62934b",
            "items": [
                {
                    "id": "019e83d1-9f06-704d-b92e-0dbc2225c33c",
                    "product_id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                    "quantity": 3,
                    "unit_price": 80000,
                    "line_total": 240000,
                    "product": {
                        "id": "019e83ac-deb7-71c7-b2b2-c16b8b974e1e",
                        "name": "Nike Air Force",
                        "currency": "NGN",
                        "price": 80000,
                        "primary_image_url": "https://banex-marketplace-api.test/storage/products/019e83ac-deb7-71c7-b2b2-c16b8b974e1e/2d5b1ba4-b341-4430-ab95-9df5823f160b.webp"
                    },
                    "created_at": {
                        "item": "2026-06-01T15:33:33.000000Z"
                    }
                }
            ],
            "summary": {
                "items_count": 3,
                "subtotal": 240000,
                "currency": "NGN"
            },
            "updated_at": {
                "item": "2026-06-01T15:27:44.000000Z"
            }
        }
    }
}
```

##### Clear Cart

**Method**: `DELETE`
**URL**: `{{localUrl}}/user/cart/`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Cart cleared.",
    "data": {
        "cart": {
            "id": "019e83cc-4cce-737e-9d0d-2f4b18b80106",
            "user_id": "019e63b9-924c-70be-a845-95a28c62934b",
            "items": [],
            "summary": {
                "items_count": 0,
                "subtotal": 0,
                "currency": "NGN"
            },
            "updated_at": {
                "item": "2026-06-01T15:27:44.000000Z"
            }
        }
    }
}
```

#### Profile

**Method**: `GET`
**URL**: `{{localUrl}}/user/profile`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "OK",
    "data": {
        "user": {
            "id": "019e3a5b-c0a1-7392-9205-91a4a519bdf0",
            "full_name": "Warren Mayer",
            "email": "gladys_gutkowski95@gmail.com",
            "type": "user",
            "email_verified_at": {
                "item": "2026-05-18T10:03:10.000000Z"
            },
            "created_at": {
                "item": "2026-05-18T09:12:32.000000Z"
            }
        }
    }
}
```

#### Change Password

**Method**: `PUT`
**URL**: `{{localUrl}}/user/password`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Password changed successfully. Please sign in again.",
    "data": null
}
```

### Auth

#### Login

**Method**: `POST`
**URL**: `{{localUrl}}/auth/login`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Signed in successfully.",
    "data": {
        "user": {
            "id": "019e3a5b-c0a1-7392-9205-91a4a519bdf0",
            "full_name": "Warren Mayer",
            "email": "gladys_gutkowski95@gmail.com",
            "type": "user",
            "email_verified_at": null,
            "created_at": {
                "item": "2026-05-18T09:12:32.000000Z"
            }
        },
        "token": "019e3a6d-6849-7002-b347-94bddf122620|qzYkMa85y8D5rjdCd21MF8fsJ9xZLeryPvKj8Ebj34a7c042"
    }
}
```

#### Form Signup

**Method**: `POST`
**URL**: `{{localUrl}}/auth/register`

**Sample Responses**:

*Success* (201 Created)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Account created successfully.",
    "data": {
        "user": {
            "id": "019e3a5b-c0a1-7392-9205-91a4a519bdf0",
            "full_name": "Warren Mayer",
            "email": "gladys_gutkowski95@gmail.com",
            "type": "user",
            "email_verified_at": null,
            "created_at": {
                "item": "2026-05-18T09:12:32.000000Z"
            }
        },
        "token": "019e3a5b-c0b4-732b-b6a6-91b433f0069c|ccWlvBhvOfz6DQ65wMsp6O0glz5mhss1Qp8YCidJ7fbd120f"
    }
}
```

#### Resend OTP

**Method**: `POST`
**URL**: `{{baseUrl}}/auth/email/otp`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Verification code resent to your email address.",
    "data": null
}
```

#### Verify OTP

**Method**: `POST`
**URL**: `{{localUrl}}/auth/email/verify`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Email address verified successfully.",
    "data": {
        "user": {
            "id": "019e30c5-2742-7168-beda-b9a80c7bb953",
            "full_name": "Kristofer Gulgowski",
            "email": "jabari.connelly@hotmail.com",
            "email_verified_at": {
                "item": "2026-05-16T12:35:50.000000Z"
            },
            "created_at": {
                "item": "2026-05-16T12:31:27.000000Z"
            }
        }
    }
}
```

#### Google Signup

**Method**: `POST`
**URL**: `{{localUrl}}/auth/google`


#### Logout

**Method**: `POST`
**URL**: `{{localUrl}}/auth/logout`

**Sample Responses**:

*Logout* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Signed out successfully.",
    "data": null
}
```

#### Forgot Password

**Method**: `POST`
**URL**: `{{baseUrl}}/auth/password/forgot`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "If an account with that email exists, a password reset link has been sent.",
    "data": null
}
```

#### Reset Password

**Method**: `POST`
**URL**: `{{baseUrl}}/auth/password/reset`

**Sample Responses**:

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "If an account with that email exists, a password reset link has been sent.",
    "data": null
}
```

*Success* (200 OK)
```json
{
    "success": true,
    "code": 0,
    "locale": "en",
    "message": "Password reset successfully.",
    "data": {
        "user": {
            "id": "019e3a5b-c0a1-7392-9205-91a4a519bdf0",
            "full_name": "Warren Mayer",
            "email": "gladys_gutkowski95@gmail.com",
            "type": "user",
            "email_verified_at": {
                "item": "2026-05-18T10:03:10.000000Z"
            },
            "created_at": {
                "item": "2026-05-18T09:12:32.000000Z"
            }
        },
        "token": "019e3adb-c406-7360-9a3c-a4a1909298bb|gYq9AnYMedTqhLiYMRMxL46mg4OZow5RCCwOQ3YOf98141ca"
    }
}
```

### Test

**Method**: `GET`
**URL**: `{{baseUrl}}/api/`



<!-- END:nextjs-agent-rules -->
