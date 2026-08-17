async function applyCode(promoCode, utils) {
  const txid = (document.cookie.match(/otx=([^&;]+)?/) || [])[1];
  try {
    const response = await $.ajax({
      url: '/a/checkout/basket/update_promotion_or_gift_certificate',
      type: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Parent-Txid': txid,
      },
      data: JSON.stringify({
        promotion_code: promoCode,
      }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function getCart(utils) {
  const txid = (document.cookie.match(/otx=([^&;]+)?/) || [])[1];
  try {
    const response = await $.ajax({
      url: '/a/checkout/basket/show',
      type: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Parent-Txid': txid,
      },
      data: JSON.stringify({
        display_card_rewards: true,
        product_data: [{}],
        update: 1,
      }),
    });

    utils.logger.debug('Finished getting cart info');
    return response;
  } catch (error) {
    utils.logger.debug(`Error getting cart info: ${error}`);
    return null;
  }
}

function updatePrice(priceResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    newPrice = priceResponse.order_summary.total_cost_string || originalPrice;
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
  if (applyCodeResponse.success) {
    const priceResponse = await getCart(utils);
    finalPrice = updatePrice(priceResponse, cartPriceSelector, originalPrice, utils);
  }

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(500);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
