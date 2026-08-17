async function applyCode(promoCode, utils) {
  const orderId = window.sessionStorage.getItem('orderId') || '';
  const token = (document.cookie.match(/ub=([^&;]+)?/) || [])[1] || '';
  const country = (document.cookie.match(/ff-country=([^&;]+)?/) || [])[1] || '';
  const currency = (document.cookie.match(/ff-currency=([^&;]+)?/) || [])[1] || '';

  try {
    const response = await $.ajax({
      url: `https://secure-gateway.farfetch.com/orders/${orderId}/promocode`,
      type: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Ff-Country': country,
        'Ff-Currency': currency,
        'X-Ffbenefits': token,
      },
      xhrFields: {
        // To allow cross domain cookies
        withCredentials: true,
      },
      data: JSON.stringify({ promocode: promoCode }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(utils) {
  const orderId = window.sessionStorage.getItem('orderId') || '';
  const token = (document.cookie.match(/ub=([^&;]+)?/) || [])[1] || '';
  const country = (document.cookie.match(/ff-country=([^&;]+)?/) || [])[1] || '';
  const currency = (document.cookie.match(/ff-currency=([^&;]+)?/) || [])[1] || '';

  try {
    const response = await $.ajax({
      url: `https://secure-gateway.farfetch.com/orders/${orderId}/promocode`,
      type: 'DELETE',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Ff-Country': country,
        'Ff-Currency': currency,
        'X-Ffbenefits': token,
      },
      xhrFields: {
        // To allow cross domain cookies
        withCredentials: true,
      },
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
    newPrice = applyCodeResponse?.price?.total?.raw || originalPrice;
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
  } else if (!applyCodeResponse?.error) {
    await removeCode(utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
