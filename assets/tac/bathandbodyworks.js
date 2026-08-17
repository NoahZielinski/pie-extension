async function applyCode(promoCode, utils) {
  const FORM_ID = '#cart-items-form';
  // Serialize form data and replace coupon code
  const formData = $(FORM_ID).serialize();

  try {
    const response = $.ajax({
      url: `https://www.bathandbodyworks.com/on/demandware.store/Sites-BathAndBodyWorks-Site/en_US/CartController-AddPromoCode?couponCode=${promoCode}`,
      type: 'POST',
      data: formData,
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
    newPrice = $(applyCodeResponse).find(cartPriceSelector).text();
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
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(500);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign tacSubmit function to window object
window.tacSubmit = tacSubmit;
