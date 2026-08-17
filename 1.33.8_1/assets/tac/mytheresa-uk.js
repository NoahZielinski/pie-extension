async function applyCode(promoCode, utils) {
  const cartId = (document.cookie.match(/mt_cart_id=([^&;]+)?/) || [])[1] || '';
  const store = (document.cookie.match(/mt_geo=([^&;]+)?/) || [])[1] || '';

  const graphqlQuery = {
    query: `mutation ApplyPromotionCouponToCartMutation(
      $cartId: String!
      $coupon: String!
    ) {
      xApplyPromotionCoupon(cartId: $cartId, coupon: $coupon) {
        ...cartData
        __typename
      }
    }

    fragment cartData on XCart {
      applicablePromotions {
        message
        name
        __typename
      }
      appliedGiftCards {
        amount
        originCode
        __typename
      }
      appliedPromotions {
        couponCode
        discountAmount
        isCouponBased
        name
        __typename
      }
      availableOptions {
        climateOffsetAvailable
        giftOption
        hasOversizeProduct
        __typename
      }
      billingAddress {
        ...addressData
        __typename
      }
      cartPriceDescription
      channel {
        checkoutGloballyEnabled
        climateFee
        code
        expressCheckout
        shippingMethodImageVisible
        __typename
      }
      checkoutCompletedAt
      climateOffset
      climateOffsetTotal
      confirmationPriceDescription
      currencyCode
      currencySymbol
      customer {
        email
        isTrusted
        __typename
      }
      deliveryDutyUnpaidDescriptionCode
      gift
      giftMessage
      id
      items {
        combinedCategoryErpID
        combinedCategoryName
        couponCodes
        department
        designerErpId
        designerName
        fta
        giftCardAmount
        giftCardType
        id
        imageUrl
        isGiftCard
        isInWishlist
        name
        pNumber
        quantity
        returnable
        shipmentLocation
        slug
        sizesOnStock
        totalDiscount
        totalOriginal
        totalPromotion
        totalRegular
        variantName
        price {
          regular
          currencyCode
          currencySymbol
          discount
          discountEur
          extraDiscount
          includesVAT
          original
          originalDuties
          originalDutiesEur
          originalEur
          percentage
          vatPercentage
          regionalRulesModifications {
            priceColor
            __typename
          }
          trackedPrices {
            ...trackedPrices
            __typename
          }
          __typename
        }
        promotionLabels {
          type
          label
          __typename
        }
        size
        sizeHarmonized
        sku
        sizeSku
        seasonCode
        stock {
          availableInStock
          lastUnits
          __typename
        }
        __typename
      }
      messages {
        content
        contentTemplate
        type
        __typename
      }
      package {
        code
        description
        name
        __typename
      }
      payment {
        method {
          code
          name
          __typename
        }
        additionalInformation {
          name
          value
          __typename
        }
        details {
          name
          value
          __typename
        }
        cvcRequired
        provider
        __typename
      }
      quantity
      shipping {
        method {
          code
          imageUrl
          delayMessage
          description
          name
          packStation
          cost
          __typename
        }
        vatPercentage
        vatTotal
        __typename
      }
      shippingAddress {
        ...addressData
        __typename
      }
      surchargesTotal
      itemSurcharges {
        orderItemId
        orderItemName
        quantity
        surcharge
        __typename
      }
      shippingTotal
      subTotal
      taxFreeShoppingAvailable
      taxTotal
      total
      totalExclTax
      orderNumber
      vatPercentage
      vatTotal
      unavailableItems {
        department
        designerName
        id
        imageUrl
        name
        pNumber
        price {
          currencySymbol
          discount
          original
          percentage
          __typename
        }
        size
        sizesOnStock
        sku
        slug
        stock {
          availableInStock
          lastUnits
          __typename
        }
        __typename
      }
      __typename
    }

    fragment addressData on Address {
      academicTitle
      city
      company
      countryCode
      firstName
      houseNumber
      id
      idInformation
      lastName
      packStation
      phoneNumber
      postcode
      salutation
      state
      street
      streetAdditional
      taxIdentificationNumber
      __typename
    }

    fragment trackedPrices on XSharedProductTrackedPricesType {
      price
      priceVatOnly
      priceReduced
      priceReducedVatOnly
      priceFinalDuties
      priceEur
      priceEurVatOnly
      priceEurReduced
      priceEurReducedVatOnly
      priceEurFinalDuties
      priceHint
      isOnSale
      saleDiscount
      __typename
    }`,
    variables: {
      coupon: promoCode,
      cartId,
    },
    operationName: 'ApplyPromotionCouponToCartMutation',
  };

  try {
    const response = await $.ajax({
      url: 'https://api.mytheresa.com/api',
      type: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Cart': cartId,
        'X-Country': store,
        'X-Geo': store,
        'X-Nsu': false,
        'X-Store': store,
      },
      xhrFields: {
        // To allow cross domain cookies
        withCredentials: true,
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

async function removeCode(promoCode, utils) {
  const cartId = (document.cookie.match(/mt_cart_id=([^&;]+)?/) || [])[1] || '';
  const store = (document.cookie.match(/mt_geo=([^&;]+)?/) || [])[1] || '';

  const graphqlQuery = {
    query: `mutation RemovePromotionCouponFromCartMutation(
      $cartId: String!
      $coupon: String!
    ) {
      xRemovePromotionCoupon(cartId: $cartId, coupon: $coupon) {
        ...cartData
        __typename
      }
    }

    fragment cartData on XCart {
      applicablePromotions {
        message
        name
        __typename
      }
      appliedGiftCards {
        amount
        originCode
        __typename
      }
      appliedPromotions {
        couponCode
        discountAmount
        isCouponBased
        name
        __typename
      }
      availableOptions {
        climateOffsetAvailable
        giftOption
        hasOversizeProduct
        __typename
      }
      billingAddress {
        ...addressData
        __typename
      }
      cartPriceDescription
      channel {
        checkoutGloballyEnabled
        climateFee
        code
        expressCheckout
        shippingMethodImageVisible
        __typename
      }
      checkoutCompletedAt
      climateOffset
      climateOffsetTotal
      confirmationPriceDescription
      currencyCode
      currencySymbol
      customer {
        email
        isTrusted
        __typename
      }
      deliveryDutyUnpaidDescriptionCode
      gift
      giftMessage
      id
      items {
        combinedCategoryErpID
        combinedCategoryName
        couponCodes
        department
        designerErpId
        designerName
        fta
        giftCardAmount
        giftCardType
        id
        imageUrl
        isGiftCard
        isInWishlist
        name
        pNumber
        quantity
        returnable
        shipmentLocation
        slug
        sizesOnStock
        totalDiscount
        totalOriginal
        totalPromotion
        totalRegular
        variantName
        price {
          regular
          currencyCode
          currencySymbol
          discount
          discountEur
          extraDiscount
          includesVAT
          original
          originalDuties
          originalDutiesEur
          originalEur
          percentage
          vatPercentage
          regionalRulesModifications {
            priceColor
            __typename
          }
          trackedPrices {
            ...trackedPrices
            __typename
          }
          __typename
        }
        promotionLabels {
          type
          label
          __typename
        }
        size
        sizeHarmonized
        sku
        sizeSku
        seasonCode
        stock {
          availableInStock
          lastUnits
          __typename
        }
        __typename
      }
      messages {
        content
        contentTemplate
        type
        __typename
      }
      package {
        code
        description
        name
        __typename
      }
      payment {
        method {
          code
          name
          __typename
        }
        additionalInformation {
          name
          value
          __typename
        }
        details {
          name
          value
          __typename
        }
        cvcRequired
        provider
        __typename
      }
      quantity
      shipping {
        method {
          code
          imageUrl
          delayMessage
          description
          name
          packStation
          cost
          __typename
        }
        vatPercentage
        vatTotal
        __typename
      }
      shippingAddress {
        ...addressData
        __typename
      }
      surchargesTotal
      itemSurcharges {
        orderItemId
        orderItemName
        quantity
        surcharge
        __typename
      }
      shippingTotal
      subTotal
      taxFreeShoppingAvailable
      taxTotal
      total
      totalExclTax
      orderNumber
      vatPercentage
      vatTotal
      unavailableItems {
        department
        designerName
        id
        imageUrl
        name
        pNumber
        price {
          currencySymbol
          discount
          original
          percentage
          __typename
        }
        size
        sizesOnStock
        sku
        slug
        stock {
          availableInStock
          lastUnits
          __typename
        }
        __typename
      }
      __typename
    }

    fragment addressData on Address {
      academicTitle
      city
      company
      countryCode
      firstName
      houseNumber
      id
      idInformation
      lastName
      packStation
      phoneNumber
      postcode
      salutation
      state
      street
      streetAdditional
      taxIdentificationNumber
      __typename
    }

    fragment trackedPrices on XSharedProductTrackedPricesType {
      price
      priceVatOnly
      priceReduced
      priceReducedVatOnly
      priceFinalDuties
      priceEur
      priceEurVatOnly
      priceEurReduced
      priceEurReducedVatOnly
      priceEurFinalDuties
      priceHint
      isOnSale
      saleDiscount
      __typename
    }`,
    variables: {
      coupon: promoCode,
      cartId,
    },
    operationName: 'RemovePromotionCouponFromCartMutation',
  };

  try {
    const response = await $.ajax({
      url: 'https://api.mytheresa.com/api',
      type: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Cart': cartId,
        'X-Country': store,
        'X-Geo': store,
        'X-Nsu': false,
        'X-Store': store,
      },
      xhrFields: {
        // To allow cross domain cookies
        withCredentials: true,
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

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const rawPrice = applyCodeResponse?.data?.xApplyPromotionCoupon?.total;
    newPrice = rawPrice ? rawPrice / 100 : originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else if (!applyCodeResponse?.errors) {
    await removeCode(promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
