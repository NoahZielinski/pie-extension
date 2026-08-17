async function applyCode(promoCode, utils) {
  // Serialize form
  const serializedForm = $('.keycodeFormContainer form').serializeArray();

  try {
    const response = await $.ajax({
      url: 'https://www.sierra.com/cart/applykeycode/',
      type: 'POST',
      data: serializedForm,
      contentType: 'application/x-www-form-urlencoded',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
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
    const updatePriceResponse = await $.ajax({
      url: window.location.href,
      type: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    newPrice = $(updatePriceResponse).find(cartPriceSelector).text() || originalPrice;
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

  await applyCode(promoCode, utils);
  finalPrice = await updatePrice(cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location.reload();
    await utils.wait(200);
  }
  // Return parsed price
  return Number(utils.parsePrice(finalPrice));
}

// Assign tacSubmit to window object
window.tacSubmit = tacSubmit;
