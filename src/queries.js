export const SHOP_DETAILS_QUERY = `
query GetShop {
  shop {
    description
    moneyFormat
    name
  }
}
`

export const SHOP_POLICIES_QUERY = `
  query GetPolicies {
    shop {
      shippingPolicy {
        body
        handle
        id
        title
        url      
      }      
      privacyPolicy {
        body
        handle
        id
        title
        url
      }
      refundPolicy {
        body
        handle
        id
        title
        url
      }
      termsOfService {
        body
        handle
        id
        title
        url
      }
    }
  }
`

export const PAGES_QUERY = `
  query GetPages($first: Int!, $after: String) {
    pages(first: $first, after: $after) {
      pageInfo {
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          handle
          title
          body
          bodySummary
          updatedAt
          onlineStoreUrl
          metafields(first: 30) {
            edges {
              node {
                id
                key
                value
                description
              }
            }
          }
        }
      }
    }
  }
`

export const MENU_QUERY = `
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      id
      handle
      title
      items {
        title
        type
        url
        items {
          title
          type
          url
        }
      }
    }
  }
`
