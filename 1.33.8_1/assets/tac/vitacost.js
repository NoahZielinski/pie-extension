async function applyCodeCart(promoCode, utils) {
  try {
    const response = await $.ajax({
      url: '/Checkout/ShoppingCart.aspx?sce=view',
      method: 'POST', // Method is POST
      data: {
        __VIEWSTATE: $('input[name="__VIEWSTATE"]').attr('value'), // Value of view state
        IamMasterFrameYesIam$ctl02$txtPromotion: promoCode, // Coupon code
        __ASYNCPOST: true, // Async post value
        IamMasterFrameYesIam$ctl02$btnPromoUpdate: 'Apply', // Apply button value
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
  const INSTANCE_ID_REGEX = /"spcFrmInstanceId":"(.*?)"/;
  const instanceId = ($('script').text().match(INSTANCE_ID_REGEX) || [])[1];
  let checkoutForm = $('#spcFrm').serialize();
  checkoutForm += `&commands[]=Summary_PromoUpdate&adobeCommand=Summary_PromoUpdate&spcAjax=1&spcFrmInstanceId=${instanceId}`;

  try {
    const response = await $.ajax({
      url: 'https://www.vitacost.com/Checkout.aspx',
      method: 'POST', // Method is POST
      data: checkoutForm,
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
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

    newPrice = $(priceResponse).find(cartPriceSelector).text() || originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice }) {
  const CHECKOUT_URL_REGEX = /vitacost\.com\/checkout\.aspx/;
  const couponLocation = window.location.href.match(CHECKOUT_URL_REGEX) ? 'checkout' : 'cart';
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  if (couponLocation === 'cart') {
    await applyCodeCart(promoCode, utils);
  } else {
    await applyCodeCheckout(promoCode, utils);
  }

  finalPrice = await updatePrice(cartPriceSelector, originalPrice, utils);

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Assign tacSubmit function to window object
window.tacSubmit = tacSubmit;
