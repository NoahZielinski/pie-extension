async function applyCodeCart(promoCode, utils) {
  const formReplacementObj = {
    '/atg/commerce/promotion/CouponFormHandler.claimCoupon': 'APPLY',
    '/atg/commerce/promotion/CouponFormHandler.couponClaimCode': promoCode,
    '_D:/atg/commerce/promotion/CouponFormHandler.couponClaimCode': promoCode,
  };

  // Serialize form
  let serializedForm = $('#promo').serializeArray();

  serializedForm.forEach((formItem) => {
    if (Object.values(formReplacementObj).includes(formItem.name)) {
      Object.assign(formItem.value, formReplacementObj[formItem.name]);
    }
  });

  serializedForm = $.param(serializedForm);

  try {
    const response = await $.ajax({
      url: 'https://tjmaxx.tjx.com/store/checkout/cart.jsp?_DARGS=/store/checkout/views/cart.jsp.promo',
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

async function applyCodeCheckout(promoCode, utils) {
  const serializedForm = $('#checkoutPromoForm').serialize();

  try {
    const response = await $.ajax({
      url: 'https://tjmaxx.tjx.com/store/checkout/checkout.jsp?shipping=true&_DARGS=/store/checkout/includes/longScrollPromoBoxPanel.jsp.checkoutPromoForm',
      type: 'POST',
      data: serializedForm,
      contentType: 'application/x-www-form-urlencoded',
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
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
  const requestUrl = window.location.href;
  let newPrice;

  try {
    const updatePriceResponse = await $.ajax({
      url: requestUrl,
      type: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    newPrice = $(updatePriceResponse).find(cartPriceSelector).text();
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
  const CHECKOUT_URL_REGEX = /tjx\.com\/store\/checkout\/checkout\.jsp/;
  const couponLocation = window.location.href.match(CHECKOUT_URL_REGEX) ? 'checkout' : 'cart';
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  if (couponLocation === 'cart') {
    await applyCodeCart(promoCode, utils);
  } else {
    await applyCodeCheckout(promoCode, utils);
  }
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
