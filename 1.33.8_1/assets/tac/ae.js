// Fetch access token from local storage
const ACCESS_TOKEN_KEY = 'aeotoken';
const accessToken = JSON.parse(window.localStorage.getItem(ACCESS_TOKEN_KEY)).access_token;

const HEADERS = {
  accept: 'application/json',
  'accept-language': 'en-US,en;q=0.9',
  aelang: 'en_US',
  aesite: 'AEO_US',
  'x-access-token': accessToken,
  'content-type': 'application/json',
};

async function applyCode(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: 'https://www.ae.com/ugp-api/bag/v1/coupon',
      method: 'POST',
      headers: HEADERS,
      data: JSON.stringify({
        couponCode: promoCode,
      }),
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
    if (!applyCodeResponse || applyCodeResponse.errors.length > 0) {
      newPrice = originalPrice;
    } else {
      const response = await $.ajax({
        url: 'https://www.ae.com/ugp-api/bag/v1?inventoryCheck=true',
        method: 'GET',
        headers: HEADERS,
      });

      newPrice = response.data.summary.total;
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

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(promoCode, utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  // reload the page after applying the best coupon
  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(200);
  }

  return Number(utils.parsePrice(finalPrice));
}

window.tacSubmit = tacSubmit;
