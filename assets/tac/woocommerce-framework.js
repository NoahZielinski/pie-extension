async function applyCode(promoCode, utils, baseUrl) {
  const token = ($('script')
    .text()
    .match(/"apply_coupon_nonce":"(.*?)"/) || [])[1];

  try {
    const response = await $.ajax({
      url: `${baseUrl}/?wc-ajax=apply_coupon`,
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      data: {
        security: token,
        coupon_code: promoCode,
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function updatePrice(cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const priceResponse = await $.ajax({
      url: window.location.href,
      type: 'GET',
    });

    let scrapedPrice = $(priceResponse).find(cartPriceSelector).text();

    if (!scrapedPrice) {
      scrapedPrice = $(priceResponse).filter(cartPriceSelector).text();
    }

    newPrice = scrapedPrice || originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price' ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(`${newPrice}`);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice }) {
  const BASE_URL_REGEX = /((?:https|http)?:\/\/?(?:[^@\n]+@)?(?:www\.)?(?:[^:/\n?]+)).*/;
  const baseUrl = (window.location.href.match(BASE_URL_REGEX) || [])[1];
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  await applyCode(promoCode, utils, baseUrl);
  finalPrice = await updatePrice(cartPriceSelector, originalPrice, utils);

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign the tacSubmit function to the window object
window.tacSubmit = tacSubmit;
