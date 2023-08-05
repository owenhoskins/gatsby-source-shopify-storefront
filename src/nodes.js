import { map } from "p-iteration"
import { createRemoteFileNode } from "gatsby-source-filesystem"

import {
  TYPE_PREFIX,
  SHOP_POLICY,
  SHOP_DETAILS,
  PAGE,
  PAGE_METAFIELD,
  MENU,
} from "./constants"

// @TODO: all of these need handlers where we can initialize createNodeFactory like PageNode
export const ShopPolicyNode = (entity, { createNodeId, createNodeFactory }) =>
  createNodeFactory(SHOP_POLICY)(entity)

export const ShopDetailsNode = (entity, { createNodeId, createNodeFactory }) =>
  createNodeFactory(SHOP_DETAILS)(entity)

export const MenuNode = (entity, { createNodeId, createNodeFactory }) =>
  createNodeFactory(MENU)(entity)

export const PageMetafieldNode = (entity, { createNodeFactory }) => {
  console.log("PageMetafieldNode: entity: ", entity)
  const factory = createNodeFactory(PAGE_METAFIELD)
  const node = factory(entity)
  return node
}

// this is the `nodeFactory` called from gatsby-node `createNodes`
// well it seems like `createNodeFactory` does not have a callback as it had before
export const PageNode = (entity, { createNodeId, createNodeFactory }) => {
  const factory = createNodeFactory(PAGE)
  const node = factory(entity)
  // console.log("PageNode: entity", entity)
  // console.log("PageNode: node", node)

  /*
  if (node.metafields) {
    const metafields = node.metafields.edges.map(edge => edge.node)

    node.metafields___NODE = metafields.map(metafield =>
      // how to replace generateNodeId with the new helper createNodeId
      // generateNodeId(PAGE_METAFIELD, metafield.id)
      createNodeId(`${PAGE_METAFIELD}${metafield.id}`)
    )

    delete node.metafields
  }*/

  return node
}
