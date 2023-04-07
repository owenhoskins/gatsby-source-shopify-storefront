import chalk from "chalk"
import { createNodeHelpers } from "gatsby-node-helpers"
import { pipe } from "lodash/fp"
import { forEach } from "p-iteration"
import {
  CONTENT,
  NAVIGATION,
  NODE_TO_ENDPOINT_MAPPING,
  PAGE,
  SHOP,
  SHOP_DETAILS,
  SHOP_POLICY,
  TYPE_PREFIX,
} from "./constants"
import { createClient } from "./create-client"
import {
  printGraphQLError,
  queryAll,
  queryMenuWithHandle,
  queryOnce,
} from "./lib"
import {
  MenuNode,
  PageMetafieldNode,
  PageNode,
  ShopDetailsNode,
  ShopPolicyNode,
} from "./nodes"
import {
  MENU_QUERY,
  PAGES_QUERY,
  SHOP_DETAILS_QUERY,
  SHOP_POLICIES_QUERY,
} from "./queries"

console.log("gatsby-source-shopify-storefront is on 6/4/22!")

export const sourceNodes = async (
  {
    actions: { createNode, touchNode },
    createNodeId,
    createContentDigest,
    store,
    cache,
    getCache,
    reporter,
    getNode,
  },
  {
    shopName,
    accessToken,
    apiVersion = `2023-01`, // 2020-07 does not contain the `menu` field on QueryRoot
    verbose = true,
    paginationSize = 250,
    shopifyConnections = [SHOP, CONTENT, NAVIGATION],
    downloadImages = true,
    shopifyQueries = {},
  }
) => {
  const client = createClient(shopName, accessToken, apiVersion)

  const defaultQueries = {
    shopPolicies: SHOP_POLICIES_QUERY,
    shopDetails: SHOP_DETAILS_QUERY,
    pages: PAGES_QUERY,
    menu: MENU_QUERY,
  }

  const queries = { ...defaultQueries, ...shopifyQueries }

  // Convenience function to namespace console messages.
  const formatMsg = msg =>
    chalk`\n{blue gatsby-source-shopify/${shopName}} ${msg}`

  try {
    console.log(formatMsg(`starting to fetch data from Shopify`))

    // Arguments used for file node creation.
    const imageArgs = {
      createNode,
      createNodeId,
      touchNode,
      store,
      cache,
      getCache,
      getNode,
      reporter,
      downloadImages,
    }

    // Arguments used for node creation.
    const args = {
      client,
      createNode,
      createNodeId,
      formatMsg,
      verbose,
      imageArgs,
      paginationSize,
      queries,
    }

    const helpers = createNodeHelpers({
      typePrefix: TYPE_PREFIX,
      createNodeId: createNodeId,
      createContentDigest: createContentDigest,
    })

    // Message printed when fetching is complete.
    const msg = formatMsg(`finished fetching data from Shopify`)

    console.log("shopifyConnections test:", shopifyConnections)

    let promises = []

    if (shopifyConnections.includes(SHOP)) {
      promises = promises.concat([
        createShopPolicies(args, helpers),
        // createShopDetails(args, helpers),
      ])
    }

    if (shopifyConnections.includes(CONTENT)) {
      promises = promises.concat([
        createNodes(
          PAGE,
          queries.pages,
          PageNode,
          args,
          helpers,
          async (page, pageNode) => {
            if (page.metafields)
              await forEach(page.metafields.edges, async edge =>
                createNode(await PageMetafieldNode(edge.node, helpers))
              )
          }
        ),
      ])
    }

    if (shopifyConnections.includes(NAVIGATION)) {
      promises = promises.concat([createMenus(args, helpers)])
    }

    console.time(msg)
    await Promise.all(promises)
    console.timeEnd(msg)
  } catch (e) {
    console.error(chalk`\n{red error} an error occurred while sourcing data`)

    // If not a GraphQL request error, let Gatsby print the error.
    if (!e.hasOwnProperty(`request`)) throw e

    printGraphQLError(e)
  }
}

/**
 * Fetch and create nodes for the provided endpoint, query, and node factory.
 */
const createNodes = async (
  endpoint,
  query,
  nodeFactory,
  { client, createNode, formatMsg, verbose, imageArgs, paginationSize },
  helpers,
  f = async () => {}
) => {
  // Message printed when fetching is complete.
  const msg = formatMsg(`fetched and processed ${endpoint} nodes`)

  if (verbose) console.time(msg)
  await forEach(
    await queryAll(
      client,
      [NODE_TO_ENDPOINT_MAPPING[endpoint]],
      query,
      paginationSize
    ),
    async entity => {
      const node = nodeFactory(entity, helpers)
      createNode(node)
      await f(entity, node)
    }
  )
  if (verbose) console.timeEnd(msg)
}

/**
 * Fetch and create nodes for shop main menu.
 */
const createMenus = async (
  { client, createNode, formatMsg, verbose, queries },
  helpers
) => {
  // // Message printed when fetching is complete.
  const msg = formatMsg(`fetched and processed ${NAVIGATION} nodes`)

  if (verbose) console.time(msg)
  const { menu: mainMenu } = await queryMenuWithHandle(
    client,
    queries.menu,
    "main-menu"
  )
  const { menu: footerMenu } = await queryMenuWithHandle(
    client,
    queries.menu,
    "footer"
  )
  const { menu: policyMenu } = await queryMenuWithHandle(
    client,
    queries.menu,
    "policy-menu"
  )
  const menus = { mainMenu, footerMenu, policyMenu }
  Object.entries(menus)
    .filter(([_, menu]) => Boolean(menu))
    .forEach(pipe(([type, menu]) => MenuNode(menu, helpers), createNode))

  if (verbose) console.timeEnd(msg)
}

/**
 * Fetch and create nodes for shop details.
 */
const createShopDetails = async (
  { client, createNode, formatMsg, verbose, queries },
  helpers
) => {
  // // Message printed when fetching is complete.
  const msg = formatMsg(`fetched and processed ${SHOP_DETAILS} nodes`)

  if (verbose) console.time(msg)
  const { shop } = await queryOnce(client, queries.shopDetails)
  createNode(ShopDetailsNode(shop, helpers))
  if (verbose) console.timeEnd(msg)
}

/**
 * Fetch and create nodes for shop policies.
 */
const createShopPolicies = async (
  { client, createNode, formatMsg, verbose, queries },
  helpers
) => {
  // Message printed when fetching is complete.
  const msg = formatMsg(`fetched and processed ${SHOP_POLICY} nodes`)

  if (verbose) console.time(msg)
  const { shop: policies } = await queryOnce(client, queries.shopPolicies)
  Object.entries(policies)
    .filter(([_, policy]) => Boolean(policy))
    .forEach(
      pipe(([type, policy]) => ShopPolicyNode(policy, helpers), createNode)
    )
  if (verbose) console.timeEnd(msg)
}
