/*
* Define the version of the Google Pay API referenced when creating your
* configuration
*/
const baseRequest = {
	apiVersion: 2,
	apiVersionMinor: 0,
};


// Define the isReadyToPayRequest object
const isReadyToPayRequest = {
	apiVersion: 2,
	apiVersionMinor: 0,
	allowedPaymentMethods: [
		{
			type: 'CARD',
			parameters: {
				allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
				allowedCardNetworks: ['VISA', 'MASTERCARD']
			}
		}

	]
};

let paymentsClient = null,
	allowedPaymentMethods = null,
	merchantInfo = null;
/* Configure your site's support for payment methods supported by the Google Pay */
function getGoogleIsReadyToPayRequest(allowedPaymentMethods) {
	return Object.assign({}, baseRequest, {
		allowedPaymentMethods: allowedPaymentMethods,
	});
}
/* Fetch Default Config from PayPal via PayPal SDK */
async function getGooglePayConfig() {
	if (allowedPaymentMethods == null || merchantInfo == null) {
		const googlePayConfig = await paypal.Googlepay().config();
		allowedPaymentMethods = googlePayConfig.allowedPaymentMethods;
		merchantInfo = googlePayConfig.merchantInfo;
	}
	return {
		allowedPaymentMethods,
		merchantInfo,
	};
}
/* Configure support for the Google Pay API */
async function getGooglePaymentDataRequest() {
	const paymentDataRequest = Object.assign({}, baseRequest);
	const { allowedPaymentMethods, merchantInfo } = await getGooglePayConfig();
	paymentDataRequest.allowedPaymentMethods = allowedPaymentMethods;
	paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
	paymentDataRequest.merchantInfo = merchantInfo;
	paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];
	return paymentDataRequest;
}
function onPaymentAuthorized(paymentData) {
	return new Promise(function (resolve, reject) {
		testProcessPayment(paymentData)
			.then(function (data) {
				resolve({ transactionState: "SUCCESS" });
			})
			.catch(function (errDetails) {
				resolve({ transactionState: "ERROR" });
			});
	});
}
function getGooglePaymentsClient() {
	if (paymentsClient === null) {
		paymentsClient = new google.payments.api.PaymentsClient({
			environment: "TEST", // or "PRODUCTION"
			paymentDataCallbacks: {
				onPaymentAuthorized: onPaymentAuthorized,
			},
		});
	}
	return paymentsClient;
}

/**
 * Initialize Google PaymentsClient after Google-hosted JavaScript has loaded
 *
 * Display a Google Pay payment button after confirmation of the viewer's
 * ability to pay.
 */
function onGooglePayLoaded() {
	const paymentsClient = getGooglePaymentsClient();
	paymentsClient.isReadyToPay(isReadyToPayRequest)
		.then(function (response) {
			if (response.result) {
				addGooglePayButton();
			}
		})
		.catch(function (err) {
			console.error(err);
		});
}
/**
 * Add a Google Pay purchase button
 */
function addGooglePayButton() {
	const paymentsClient = getGooglePaymentsClient();
	const button =
		paymentsClient.createButton({
			onClick: onGooglePaymentButtonClicked /* To be defined later */,
			allowedPaymentMethods: allowedPaymentMethods
		});
	document.getElementById('container').appendChild(button);
}

/* Note: the `googlePayConfig` object in this request is the response from `paypal.Googlepay().config()` */
async function getGooglePaymentDataRequest() {
	const googlePayConfig = await paypal.Googlepay().config();
	const paymentDataRequest = Object.assign({}, baseRequest);
	paymentDataRequest.allowedPaymentMethods = googlePayConfig.allowedPaymentMethods;
	// Uncomment for Japan integrations only
	// paymentDataRequest.allowedPaymentMethods[0].parameters.allowedAuthMethods = ['PAN_ONLY'];
	paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
	paymentDataRequest.merchantInfo = googlePayConfig.merchantInfo;
	paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];
	return paymentDataRequest;
}
function getGoogleTransactionInfo() {
	return {
		currencyCode: 'GBP',
		totalPriceStatus: 'FINAL',
		totalPrice: '24.00' // Your amount
	}
}

/* Show Google Pay payment sheet when Google Pay payment button is clicked */
async function onGooglePaymentButtonClicked() {
	const paymentDataRequest = await getGooglePaymentDataRequest();
	const paymentsClient = getGooglePaymentsClient();
	paymentsClient.loadPaymentData(paymentDataRequest);
}



async function processPayment(paymentData) {
	//return new Promise(async function (resolve, reject) {
		//console.log("DEBUG START")
		//try {
		//	console.log("DEBUG TRY")

			// Create the order on your server

			//window.open('/npors/ajax/paypal/generate_order_sandbox.asp?<%=qsGet("a="&md5_string&"&pl_id="&pl_id)%>');

			//const {id} = "83700021V1444535F";

			//alert({id});

			/*
			const {id} = await fetch('/npors/ajax/paypal/generate_order_sandbox.asp?<%=qsGet("a="&md5_string&"&pl_id="&pl_id)%>', {
			method: "POST",
			//body:
			// You can use the "body" parameter to pass optional, additional order information, such as:
			// amount, and amount breakdown elements like tax, shipping, and handling
			// item data, such as sku, name, unit_amount, and quantity
			// shipping information, like name, address, and address type
		  });
		  */
		//	const confirmOrderResponse = await paypal.Googlepay().confirmOrder({
		//		orderId: "83700021V1444535F",
		//		paymentMethodData: paymentData.paymentMethodData
		//	});

		//	console.log(1)
		//	/** Capture the Order on your Server  */
		//	if (confirmOrderResponse.status === "APPROVED") {
		//		console.log("DEBUG APPROVED")

		//		const response = await fetch('/npors/ajax/paypal/capture_payment_sandbox.asp?<%=qsGet("a="&md5_string&"&pl_id="&pl_id)%>', {
		//			method: 'POST',
		//		}).then(res => res.json());
		//		if (response.capture.status === "COMPLETED")
		//			resolve({ transactionState: 'SUCCESS' });
		//		else
		//			console.log(2)

		//			resolve({
		//				transactionState: 'ERROR',
		//				error: {
		//					intent: 'PAYMENT_AUTHORIZATION',
		//					message: 'TRANSACTION FAILED',
		//				}
		//			})
		//	} else {
		//		console.log(3)

		//		resolve({
		//			transactionState: 'ERROR',
		//			error: {
		//				intent: 'PAYMENT_AUTHORIZATION',
		//				message: 'TRANSACTION FAILED',
		//			}
		//		})
		//	}
		//} catch (err) {
		//	console.log(4)
		//	console.log(err.message);

		//	resolve({
		//		transactionState: 'ERROR',
		//		error: {
		//			intent: 'PAYMENT_AUTHORIZATION',
		//			message: err.message,
		//		}
		//	})
		//}
	//});
}


async function testProcessPayment(paymentData) {
	try {
		//const { currencyCode, totalPrice } = getGoogleTransactionInfo();
		//const order = {
		//	intent: "CAPTURE",
		//	purchase_units: [
		//		{
		//			amount: {
		//				currency_code: currencyCode,
		//				value: totalPrice,
		//			},
		//		},
		//	],
		//};
		///* Create Order */
		//const { id } = await fetch(`/orders`, {
		//	method: "POST",
		//	headers: {
		//		"Content-Type": "application/json",
		//	},
		//	body: JSON.stringify(order),
		//}).then((res) => res.json());

		const id = "83700021V1444535F";

		console.log(id);
		console.log(paymentData);

		const { status } = await paypal.Googlepay().confirmOrder({
			orderId: id,
			paymentMethodData: paymentData.paymentMethodData,
		});

		console.log(status)

		if (status === "APPROVED") {
			/* Capture the Order */
			//const captureResponse = await fetch(`/orders/${id}/capture`, {
			//	method: "POST",
			//}).then((res) => res.json());
			//return { transactionState: "SUCCESS" };

			console.log("DEBUG APPROVED")
		} else {
			console.log("DEBUG ELSE")

			return { transactionState: "ERROR" };
		}
	} catch (err) {
		console.log("DEBUG CATCH")
		console.log(err)
		return {
			transactionState: "ERROR",
			error: {
				message: err.message,
			},
		};
	}
}