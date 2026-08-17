// Constants for URLs
const CART_URL = 'https://www.prettylittlething.ca/pltmobile/coupon/couponPost/';
const CHECKOUT_URL = 'https://checkout.prettylittlething.ca/checkout-api/coupon/set';
const REMOVE_CHECKOUT_URL = 'https://checkout.prettylittlething.ca/checkout-api/coupon';

async function applyOrRemoveCode(location, promoCode, utils, action) {
  const rawCheckoutState = window.sessionStorage.getItem('state');
  const formKey = (document.cookie.match('form_key=(.*?);') || [])[1];
  const newRelicId = ($('script').text().match('xpid:"(.*=)"}') || [])[1];
  const csrfToken = (document.cookie.match('_csrf=(.*?);') || [])[1];
  let postcode = '';
  let country = '';

  try {
    const parsedCheckoutState = JSON.parse(rawCheckoutState);
    postcode = parsedCheckoutState.form.billingInformation.values.postcode;
    country = parsedCheckoutState.form.billingInformation.values.countryId;
  } catch (error) {
    utils.logger.debug(`Error parsing checkout state: ${error}`);
  }

  const headers = {
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    accept: 'application/json, text/javascript, */*; q=0.01',
  };
  const data = {};
  let requestUrl = '';

  if (location === 'cart') {
    requestUrl = CART_URL;
    headers['x-newrelic-id'] = newRelicId;
    if (action === 'apply') {
      data.code = promoCode;
      data.form_key = formKey;
      data.postcode = postcode;
      data.countryId = country;
    } else {
      data.code = '';
      data.remove = '1';
      data.form_key = formKey;
      data.postcode = postcode;
      data.countryId = country;
    }
  } else {
    headers['x-csrf-token'] = csrfToken;
    if (action === 'apply') {
      requestUrl = CHECKOUT_URL;
      data.coupon_code = promoCode;
      data.form_key = formKey;
      data.postcode = postcode;
      data.countryId = country;
    } else {
      requestUrl = REMOVE_CHECKOUT_URL;
      data.form_key = formKey;
      data.postcode = postcode;
      data.countryId = country;
    }
  }

  try {
    const response = await $.ajax({
      url: requestUrl,
      method: 'POST',
      headers,
      data,
    });

    utils.logger.debug(`Finishing ${action} coupon action`);
    return response;
  } catch (error) {
    utils.logger.debug(`Error on ${action} coupon action: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, location, cartPriceSelector, originalPrice, utils) {
  let newPrice;
  try {
    if (location === 'cart') {
      newPrice = applyCodeResponse.grand_total;
    } else {
      newPrice = applyCodeResponse.quote.quote.grand_total;
    }
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
  // Extract necessary values from the current page
  const currentUrl = window.location.href;
  const location = currentUrl.includes('checkout/cart') ? 'cart' : 'checkout';
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;

  const applyCodeResponse = await applyOrRemoveCode(location, promoCode, utils, 'apply');
  finalPrice = await updatePrice(applyCodeResponse, location, cartPriceSelector, originalPrice, utils);
  await applyOrRemoveCode(location, promoCode, utils, 'remove');
  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

// Expose the function to the global scope
window.tacSubmit = tacSubmit;
