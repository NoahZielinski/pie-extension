async function applyOrRemoveCode(promoCode, utils, action) {
  const cartId = (document.cookie.match(/g2a-cart-id=([^&;]+)?/) || [])[1] || '';

  const couponCode = action === 'apply' ? promoCode : null;

  try {
    const response = await $.ajax({
      url: `/cart/api/carts/${cartId}?`,
      type: 'PATCH',
      headers: {
        'content-type': 'application/json;charset=utf-8',
      },
      data: JSON.stringify({ couponCode }),
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;

  try {
    const priceSection = applyCodeResponse?.data?.totals;
    const priceObj = priceSection.filter((obj) => obj.code === 'grandtotal');
    const priceString = priceObj[0].price;
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

async function tacPreApply({ utils }) {
  const removeCodeButton = $('svg[class*="indexes__DiscountCodeValueContainerCellRemoveBtn"]');

  if (removeCodeButton.length > 0) {
    await applyOrRemoveCode('', utils, 'remove');
    window.location = window.location.href;
    await utils.wait(800);
  }
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  finalPrice = updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest) {
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign the function to the global window object
window.tacSubmit = tacSubmit;
window.tacPreApply = tacPreApply;
