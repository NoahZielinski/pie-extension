async function applyCode(promoCode, utils) {
  const csrfToken = (document.cookie.match(/csrf_token=([^&;]+)?/) || [])[1];
  const cartId = ($('meta[property="og:url"]')
    .attr('content')
    .match(/order_cart_id\=([^"&]+)?/) || [])[1];

  const storeIdLink = $('[data-testid="checkoutItemDetails"] a').attr('href') || '';
  const storeId = (storeIdLink.match(/(?:-|store\/)([\d]+)\/$/) || [])[1];

  const graphqlQuery = {
    query: `mutation addPromoCode(
        $promoCode: String!
        $orderCartId: String!
        $storeId: String!
        $isCardPayment: Boolean
        $isReapplyPromo: Boolean
        $bundleType: BundleType
        $campaignId: String
        $adGroupId: String
        $adId: String
      ) {
        addPromoCode(
          promoCode: $promoCode
          orderCartId: $orderCartId
          storeId: $storeId
          isReapplyPromo: $isReapplyPromo
          isCardPayment: $isCardPayment
          bundleType: $bundleType
          campaignId: $campaignId
          adGroupId: $adGroupId
          adId: $adId
        ) {
          id
          total
          ...CheckoutLineItemsFragment
          discountDetails {
            ...CheckoutDiscountDetailsFragment
            __typename
          }
          consumerPromotion {
            ...CheckoutConsumerPromotionFragment
            __typename
          }
          allConsumerPromotion {
            ...CheckoutConsumerPromotionFragment
            __typename
          }
          __typename
        }
      }

      fragment CheckoutLineItemsFragment on OrderCart {
        lineItemsList {
          chargeId
          label
          originalMoney {
            unitAmount
            displayString
            __typename
          }
          finalMoney {
            unitAmount
            displayString
            __typename
          }
          tooltip {
            title
            paragraphs {
              title
              description
              __typename
            }
            __typename
          }
          note
          labelIcon
          priceIcon
          discountIcon
          highlight
          lineItemCalloutModal {
            title
            description
            type
            __typename
          }
          __typename
        }
        __typename
      }

      fragment CheckoutDiscountDetailsFragment on DiscountDetails {
        message
        appliedDiscount {
          displayString
          unitAmount
          __typename
        }
        requiredAction
        __typename
      }

      fragment CheckoutConsumerPromotionFragment on CheckoutConsumerPromotion {
        code
        campaignId
        adGroupId
        adId
        maxApplicableDeliveryCount
        description
        title
        featuredOnApp
        expiration
        target
        __typename
      }`,
    variables: {
      orderCartId: cartId,
      isCardPayment: false,
      promoCode,
      storeId,
    },
    operationName: 'addPromoCode',
  };

  try {
    const response = await $.ajax({
      url: '/graphql/addPromoCode?operation=addPromoCode',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Csrftoken': csrfToken,
        'X-Experience-Id': 'doordash',
      },
      data: JSON.stringify(graphqlQuery),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function getRemoveCodeIds(applyCodeResponse, promoCode) {
  let adGroupId;
  let adId;
  let campaignId;

  try {
    const consumerPromotions = applyCodeResponse.data.addPromoCode.consumerPromotion;
    const promoObjKey = Object.keys(consumerPromotions || {}).find((key) => consumerPromotions[key]?.code.toLowerCase() === promoCode.toLowerCase());
    adGroupId = consumerPromotions[promoObjKey]?.adGroupId;
    adId = consumerPromotions[promoObjKey]?.adId;
    campaignId = consumerPromotions[promoObjKey]?.campaignId;
  } catch (error) {
    adGroupId = null;
    adId = null;
    campaignId = null;
  }

  return { adGroupId, adId, campaignId };
}

async function removeCode(applyCodeResponse, promoCode, utils) {
  // extract relevant IDs for the coupon we just applied, these all must be sent as variables in the remove request
  const { adGroupId, adId, campaignId } = getRemoveCodeIds(applyCodeResponse, promoCode);

  const csrfToken = (document.cookie.match(/csrf_token=([^&;]+)?/) || [])[1];
  const cartId = ($('meta[property="og:url"]')
    .attr('content')
    .match(/order_cart_id\=([^"&]+)?/) || [])[1];

  const storeIdLink = $('[data-testid="checkoutItemDetails"] a').attr('href') || '';
  const storeId = (storeIdLink.match(/(?:-|store\/)([\d]+)\/$/) || [])[1];

  const graphqlQuery = {
    query: `mutation removePromoCode(
        $promoCode: String!
        $orderCartId: String!
        $isCardPayment: Boolean
        $campaignId: String
        $adGroupId: String
        $adId: String
      ) {
        removePromoCode(
          promoCode: $promoCode
          orderCartId: $orderCartId
          isCardPayment: $isCardPayment
          campaignId: $campaignId
          adGroupId: $adGroupId
          adId: $adId
        ) {
          id
          total
          ...CheckoutLineItemsFragment
          discountDetails {
            ...CheckoutDiscountDetailsFragment
            __typename
          }
          consumerPromotion {
            ...CheckoutConsumerPromotionFragment
            __typename
          }
          __typename
        }
      }

      fragment CheckoutLineItemsFragment on OrderCart {
        lineItemsList {
          chargeId
          label
          originalMoney {
            unitAmount
            displayString
            __typename
          }
          finalMoney {
            unitAmount
            displayString
            __typename
          }
          tooltip {
            title
            paragraphs {
              title
              description
              __typename
            }
            __typename
          }
          note
          labelIcon
          priceIcon
          discountIcon
          highlight
          lineItemCalloutModal {
            title
            description
            type
            __typename
          }
          __typename
        }
        __typename
      }

      fragment CheckoutDiscountDetailsFragment on DiscountDetails {
        message
        appliedDiscount {
          displayString
          unitAmount
          __typename
        }
        requiredAction
        __typename
      }

      fragment CheckoutConsumerPromotionFragment on CheckoutConsumerPromotion {
        code
        campaignId
        adGroupId
        adId
        maxApplicableDeliveryCount
        description
        title
        featuredOnApp
        expiration
        target
        __typename
      }`,
    variables: {
      orderCartId: cartId,
      isCardPayment: false,
      adGroupId,
      adId,
      campaignId,
      promoCode,
      storeId,
    },
    operationName: 'removePromoCode',
  };

  try {
    const response = await $.ajax({
      url: '/graphql/removePromoCode?operation=removePromoCode',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Csrftoken': csrfToken,
        'X-Experience-Id': 'doordash',
      },
      data: JSON.stringify(graphqlQuery),
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error removing coupon: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const priceLineItems = applyCodeResponse.data.addPromoCode.lineItemsList;
    const discountObjKey = Object.keys(priceLineItems || {}).find((key) => priceLineItems[key]?.chargeId === 'PROMOTION_DISCOUNT');
    const rawDiscount = priceLineItems[discountObjKey]?.finalMoney?.unitAmount;
    const discount = rawDiscount ? Number(rawDiscount) / 100 : 0;
    newPrice = originalPrice - discount;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`$${newPrice}`);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else if (applyCodeResponse && !applyCodeResponse.errors) {
    await removeCode(applyCodeResponse, promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
