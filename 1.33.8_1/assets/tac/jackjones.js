async function applyCode(promoCode, utils) {
  const market = (document.cookie.match(/market=([^&;]+)?/) || [])[1] || 'nl-nl';

  try {
    const response = await $.ajax({
      url: `/api/order/${market}/basket/add-promo-code?promoCode=${promoCode}&type=json&redirect=false`,
      type: 'POST',
      headers: {
        accept: 'text/plain',
      },
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(promoCode, utils) {
  const market = (document.cookie.match(/market=([^&;]+)?/) || [])[1] || 'nl-nl';

  try {
    const response = await $.ajax({
      url: `/api/order/${market}/basket/delete-promo-code?promoCode=${promoCode}&type=json&redirect=false`,
      type: 'DELETE',
      headers: {
        accept: 'text/plain',
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
    const priceString = applyCodeResponse?.basket?.total?.amount || originalPrice;
    newPrice = Number(utils.parsePrice(priceString));
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
    window.location.reload();
    await utils.wait(500);
  } else if (!applyCodeResponse?.errors) {
    await removeCode(promoCode, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
