async function applyOrRemoveCode(promoCode, utils, action, applyCodeResponse = {}) {
  const OPERATION_NAME = action === 'apply' ? 'cartAddPromo' : 'cartRemovePromo';
  const inputType = action === 'apply' ? 'PromoInput' : 'RemovePromoInput';
  const jwtToken = (document.cookie.match('checkout_jwt=([^;]*)') || [])[1];
  let couponId = {};

  if (action === 'remove') {
    try {
      couponId = applyCodeResponse.data.cartAddPromo.promos.filter((promo) => promo.code.toUpperCase() === promoCode.toUpperCase())[0].couponId;
    } catch (error) {
      utils.logger.debug(`couponId extraction error: ${error}`);
    }
  }

  const input = action === 'apply' ? { promoCode } : { couponId };
  const graphqlBody = {
    operationName: OPERATION_NAME,
    variables: {
      input,
    },
    query: `mutation ${OPERATION_NAME}($input: ${inputType}) {
      ${OPERATION_NAME}(input: $input) {
        price {
          final
        }
        promos {
          code
          couponId
        }
      }
    }`,
  };

  try {
    const response = await $.ajax({
      url: 'https://www.jcrew.com/checkout-api/graphql',
      method: 'POST',
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'x-access-token': jwtToken,
        'x-brand': 'jc',
        'x-country-code': 'US',
        'x-operation-name': OPERATION_NAME,
      },
      data: JSON.stringify(graphqlBody),
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon action: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    const rawPrice = applyCodeResponse.data.cartAddPromo.price.final;
    newPrice = utils.parsePrice(rawPrice / 100); // raw price has no decimal point
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

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(200);
  } else {
    await applyOrRemoveCode(promoCode, utils, 'remove', applyCodeResponse);
  }

  // Return the final price as a number
  return Number(utils.parsePrice(finalPrice));
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
