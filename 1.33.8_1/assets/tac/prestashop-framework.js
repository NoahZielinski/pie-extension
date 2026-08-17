async function applyCode(utils) {
  const FORM_ID = 'form[data-link-action="add-voucher"]';
  // Serialize form data and replace coupon code
  let formData = $(FORM_ID).serialize();
  formData = `${formData}&ajax=1&action=update`;

  try {
    const response = await $.ajax({
      url: '/cart',
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        accept: 'application/json, text/javascript, */*;',
      },
      data: formData,
    });

    utils.logger.debug('Finishing applying coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Error applying coupon: ${error}`);
    return null;
  }
}

async function removeCode(applyCodeResponse, utils) {
  const token = $('#promo-code [name="token"]').val();
  let discountCode = '';

  try {
    const responseJSON = JSON.parse(applyCodeResponse);
    discountCode = responseJSON.cart.vouchers.added[0].id_cart_rule;

    const response = await $.ajax({
      url: `/cart?deleteDiscount=${discountCode}&token=${token}`,
      type: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        accept: 'application/json, text/javascript, */*;',
      },
      data: {
        ajax: 1,
        action: 'update',
      },
    });

    utils.logger.debug('Finishing removing coupon');
    return response;
  } catch (error) {
    utils.logger.debug(`Coupon Remove Error: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    const responseJSON = JSON.parse(applyCodeResponse);
    newPrice = responseJSON.cart.totals.total.value;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, runState, cartPriceSelector, currentPrice, isApplyBest }) {
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyCode(utils);
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);

  if (isApplyBest === true) {
    window.location = window.location.href;
    await utils.wait(500);
  } else {
    await removeCode(applyCodeResponse, utils);
  }

  return Number(utils.parsePrice(finalPrice));
}

// Assign tacSubmit function to window object
window.tacSubmit = tacSubmit;
