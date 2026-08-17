const COUPON_URL = 'https://www.aeropostale.com/on/demandware.store/Sites-aeropostale-Site/en_US/Cart-AddCouponJson';
const UPDATE_PRICE_URL = 'https://www.aeropostale.com/on/demandware.store/Sites-aeropostale-Site/en_US/COBilling-UpdateSummary';

async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      type: 'GET',
      url: COUPON_URL,
      data: {
        couponCode: promoCode,
        format: 'ajax',
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    // If the coupon was applied successfully
    if (applyCodeResponse.success === true) {
      // Make an AJAX request to update the price
      const priceResponse = await $.ajax({
        type: 'GET',
        url: UPDATE_PRICE_URL,
      });

      newPrice = $(priceResponse).find('.order-value').text();
    } else {
      newPrice = originalPrice;
    }
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  // If the updated price is less than the final price
  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    // Update the target element with the updated price
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

// Main function to submit the coupon and update the price
async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  // Apply the coupon and update the price
  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(500);
  }

  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
