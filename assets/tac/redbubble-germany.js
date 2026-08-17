async function applyCode(promoCode, utils) {
  const graphqlQuery = {
    query: `mutation CouponCodeApply($input: couponCodeApplyInput!) {
      couponCodeApply(input: $input) {
        cart {
          ...CartFields
          __typename
        }
        cartUserErrors {
          ...CartUserErrorFields
          __typename
        }
        __typename
      }
    }

    fragment CartFields on Cart {
      lineItems {
        id
        isQuantityEditable
        isDigital
        gaCode
        quantity
        total {
          amount
          currency
          __typename
        }
        totalShipping {
          amount
          currency
          __typename
        }
        undiscountedTotal {
          amount
          currency
          __typename
        }
        details {
          options
          type
          imageUrl
          inventoryItemId
          blankItemId
          price {
            amount
            currency
            __typename
          }
          marketingProductTypeId
          marketingSku
          productTypeId
          productUrl
          __typename
        }
        work {
          id
          title
          artistName
          __typename
        }
        __typename
      }
      summary {
        showTaxSeparately
        lineItemsCount
        tax {
          amount
          currency
          type
          __typename
        }
        total {
          amount
          currency
          __typename
        }
        subtotal {
          amount
          currency
          __typename
        }
        undiscountedSubtotal {
          amount
          currency
          __typename
        }
        shipping {
          countryCode
          countryName
          estimated {
            standard {
              price {
                amount
                currency
                __typename
              }
              tax {
                amount
                currency
                type
                __typename
              }
              amountExTax
              __typename
            }
            express {
              price {
                amount
                currency
                __typename
              }
              tax {
                amount
                currency
                type
                __typename
              }
              amountExTax
              __typename
            }
            __typename
          }
          selected {
            estimatedCost {
              price {
                amount
                currency
                __typename
              }
              tax {
                amount
                currency
                type
                __typename
              }
              amountExTax
              __typename
            }
            method
            __typename
          }
          totals {
            standard {
              amount
              currency
              __typename
            }
            express {
              amount
              currency
              __typename
            }
            __typename
          }
          __typename
        }
        digitalProductsOnly
        __typename
      }
      appliedCoupon {
        code
        type
        displayName
        discount {
          currency
          amount
          __typename
        }
        expiryDate
        __typename
      }
      messages {
        actionUrl
        applied
        severity
        text
        type
        productName
        __typename
      }
      __typename
    }

    fragment CartUserErrorFields on CartUserError {
      code
      field
      message
      __typename
    }`,
    variables: {
      input: { couponCode: promoCode },
    },
    operationName: 'CouponCodeApply',
  };

  try {
    const response = await $.ajax({
      url: '/cart',
      type: 'POST',
      headers: {
        'content-type': 'application/json',
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
  const graphqlQuery = {
    query: `mutation CouponCodeRemove {
      couponCodeRemove {
        cart {
          ...CartFields
          __typename
        }
        __typename
      }
    }

    fragment CartFields on Cart {
      lineItems {
        id
        isQuantityEditable
        isDigital
        gaCode
        quantity
        total {
          amount
          currency
          __typename
        }
        totalShipping {
          amount
          currency
          __typename
        }
        undiscountedTotal {
          amount
          currency
          __typename
        }
        details {
          options
          type
          imageUrl
          inventoryItemId
          blankItemId
          price {
            amount
            currency
            __typename
          }
          marketingProductTypeId
          marketingSku
          productTypeId
          productUrl
          __typename
        }
        work {
          id
          title
          artistName
          __typename
        }
        __typename
      }
      summary {
        showTaxSeparately
        lineItemsCount
        tax {
          amount
          currency
          type
          __typename
        }
        total {
          amount
          currency
          __typename
        }
        subtotal {
          amount
          currency
          __typename
        }
        undiscountedSubtotal {
          amount
          currency
          __typename
        }
        shipping {
          countryCode
          countryName
          estimated {
            standard {
              price {
                amount
                currency
                __typename
              }
              tax {
                amount
                currency
                type
                __typename
              }
              amountExTax
              __typename
            }
            express {
              price {
                amount
                currency
                __typename
              }
              tax {
                amount
                currency
                type
                __typename
              }
              amountExTax
              __typename
            }
            __typename
          }
          selected {
            estimatedCost {
              price {
                amount
                currency
                __typename
              }
              tax {
                amount
                currency
                type
                __typename
              }
              amountExTax
              __typename
            }
            method
            __typename
          }
          totals {
            standard {
              amount
              currency
              __typename
            }
            express {
              amount
              currency
              __typename
            }
            __typename
          }
          __typename
        }
        digitalProductsOnly
        __typename
      }
      appliedCoupon {
        code
        type
        displayName
        discount {
          currency
          amount
          __typename
        }
        expiryDate
        __typename
      }
      messages {
        actionUrl
        applied
        severity
        text
        type
        productName
        __typename
      }
      __typename
    }`,
    variables: {},
    operationName: 'CouponCodeRemove',
  };

  try {
    const response = await $.ajax({
      url: '/cart',
      type: 'POST',
      headers: {
        'content-type': 'application/json',
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
    newPrice = applyCodeResponse?.data?.couponCodeApply?.cart?.summary?.total?.amount || originalPrice;
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
  } else {
    await removeCode(promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
