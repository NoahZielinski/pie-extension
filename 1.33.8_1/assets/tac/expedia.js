async function applyOrRemoveCode(promoCode, currentPrice, utils, action) {
  const CHECKOUT_URL = 'https://www.expedia.com/Checkout';
  const productTypeAttribute = $('body').attr('data-producttype') || '';
  const productType = productTypeAttribute.includes(',') ? 'multiitem' : productTypeAttribute;
  const tripId = $('body').attr('data-tripid') || '';

  const requestData = {
    couponCode: promoCode,
    tripid: tripId,
    tlCouponAttach: 1,
    tlCouponCode: promoCode,
    productType,
    oldTripTotal: currentPrice,
    oldTripGrandTotal: currentPrice,
    binPrefix: '',
  };
  try {
    const response = await $.ajax({
      url: `${CHECKOUT_URL}/${action}`,
      type: 'POST',
      data: requestData,
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

// Function to find price by description in a list of prices
function findPriceByDescription(prices, description) {
  for (let index = 0; index < prices.length; index += 1) {
    const priceInfo = prices[index];
    const priceDescription = priceInfo && priceInfo.description;
    const amount = priceInfo && priceInfo.amount;
    if (priceDescription === description) {
      return amount;
    }
  }
  return null;
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    const { updatedPriceModel } = applyCodeResponse;
    if (updatedPriceModel) {
      newPrice =
        findPriceByDescription(updatedPriceModel, 'finalTripTotal') ||
        findPriceByDescription(updatedPriceModel, 'total') ||
        findPriceByDescription(updatedPriceModel, 'pointsTripTotal') ||
        originalPrice;
    }
  } catch (error) {
    utils.logger.debug('Error updating price');
    newPrice = originalPrice;
  }
  // If the current price is less than the final price, update the final price and the price on the page
  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeReponse = await applyOrRemoveCode(promoCode, currentPrice, utils, 'applyCoupon');
  finalPrice = await updatePrice(applyCodeReponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(200);
  } else {
    await applyOrRemoveCode(promoCode, cartPriceSelector, utils, 'removeCoupon');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign tacSubmit function to window object
window.tacSubmit = tacSubmit;
