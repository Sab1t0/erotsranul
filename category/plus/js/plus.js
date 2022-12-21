var store_data;
var fullPage;
var featurePage = false

function loadPlusData() {
	let regex = /\,(?!\s*?[\{\[\"\'\w])/g;
	var json = $("#lunarplus_json_data").attr("data-json");
	json = json.replace(/'/g, '"');
	json = json.replace(regex, '');
	store_data = JSON.parse(json);
}

function generateDurationPicker() {
	// Loop through and generate durations.
	for(var i = 0; i < store_data.products.length; i++) {
		let product = store_data.products[i];

		// Format Duration.
		var formatted_duration = product.duration;
		if (!formatted_duration.startsWith("1")) {
			formatted_duration = formatted_duration + "s";
		}

		// Column Width.
		var col = "col-4";
		if (formatted_duration == "1 Year") {
			col = "col-12";
		}

		// Check if it has a discount.
		var discount = undefined;
		if (product.hasOwnProperty('discount')) {
			discount = product.discount;
		}
	
		// Append duration to selector.
		$("#plus-duration-selector").append(`
			<div class="${col}">
				<div
					class="duration"
					data-price="${product.price}"
					data-product-id="${product.id}"
					data-discount="${discount}"
				>
					${formatted_duration}
				</div>
			</div>
		`)
	}
}

function selectDuration(duration_id, price, discount) {
	$(".duration").removeClass("selected");
	$(`.duration[data-product-id="${duration_id}"]`).addClass("selected");

	$("#plus-subscribe-btn").attr("href", `/checkout/packages/add/${duration_id}/subscription?addedVia=LC-lunar-plus-page`);
	
	var priceHtml = price;
	if (discount !== "undefined") priceHtml = `<strike>${discount}</strike>` + price;

	$("#plus-price").html(priceHtml);
}

function generateFullpage() {
	fullPage = new fullpage('#fullpage', {
		navigation: true,
		responsiveWidth: 0,
		anchors: [
			'intro',
			'exclusive-icon',
			'store-savings',
			'discord-perks',
			'cloth-cloaks',
			'exclusive-cosmetics',
			'default-dance',
			'random-emote',
			'unlimited-friends',
			'purchase'
		],
		parallax: true,
		licenseKey: 'F5375D08-FF624FB9-B2810F6A-24D04045',
		onLeave: function(origin, destination, direction) {
			$('#plus-section-label').html(destination.item.dataset.sideLabel);
			var amount = $(".section").length - 1;
			var percent = (destination.index/amount) * 100;
			if ($(window).width() < 500) {
				$('#plus-side').css('--plus-per', percent + '%')
			}
			if (destination.isLast) {
				$('#navbar-cta-btn[data-variant="store"]').removeClass('force-hide');
				$('#navbar-cta-btn[data-variant="purchase"]').addClass('force-hide');
				$('#fp-nav').addClass('force-hide');
				$('#navbar > a').attr('href', '#intro');
				$('#navbar > a .home-direct').html('Back to top');
			} else {
				$('#fp-nav').removeClass('force-hide');
			}
			if (destination.isFirst) {
				$('#navbar-cta-btn[data-variant="store"]').addClass('force-hide');
				$('#navbar-cta-btn[data-variant="purchase"]').removeClass('force-hide');
				$('#navbar > a').attr('href', '/');
				$('#navbar > a .home-direct').html('Click to visit home');
			}
			if (destination.isFirst || destination.isLast) {
				if($(window).width() > 500) $('#plus-side').animate({'left': '-100px'});
				else $('#plus-side').animate({'top': '-75px'});
				$('#navbar').animate({'margin-bottom': '-100px', 'margin-top': '0'});
			} else {
				if($(window).width() > 500) $('#plus-side').animate({"left": '0px'});
				else $('#plus-side').animate({"top": '0px'});	
				$('#navbar').animate({'margin-bottom': '0', 'margin-top': '-100px'})
			}

			featurePage = !destination.isFirst && !destination.isLast
		}
	});
}

// Update placement of sidebar when resizing window
var size = $(window).width()
$(window).on("resize", function () {
	let newWidth = $(window).width()
	if(newWidth != size) {
		if(newWidth > 500 && size < 500 && featurePage)
			$('#plus-side').animate({'left': '0px', 'top': '0px' });
		size = newWidth
	}
})

function generateSwiper() {
	new Swiper('.swiper', {
		effect: 'coverflow',
		coverflowEffect: {
			rotate: 0,
			slideShadows: true,
			depth: 0,
			scale: 0.9,
		},
		autoplay: {
			delay: 1000,
		},
		loop: true,
		spaceBetween: 15,
		breakpoints: {
			1200: {
				slidesPerView: 5
			},
			800: {
				slidesPerView: 3
			}
		},
		centeredSlides: true,
		speed: 800
	});
}

// On Document Load.
$(function () {
	// HTML -> JSON Data
	loadPlusData();

	// Generate Fullpage.js
	generateFullpage();

	// Default Nav CTA Hide.
	$('#navbar-cta-btn[data-variant="store"]').addClass('force-hide');

	// Sidebar Click Handlers.
	$('#plus-side-next').click(function() {
		fullpage_api.moveSectionDown();
	});
	$('#plus-side-icon').click(function() {
		fullpage_api.moveTo(1);
	});

	$('.back-to-store').click(function () {
		window.location.href = `https://store.lunarclient.com`
	});

	// Generate Duration Picker.
	generateDurationPicker();

	// Preselect Duration.
	selectDuration(
		$('.duration').first().attr("data-product-id"),
		$('.duration').first().attr("data-price"),
		$('.duration').first().attr("data-discount")
	);

	// Duration Click Handler
	$('.duration').click(function() {
		selectDuration(
			$(this).attr("data-product-id"),
			$(this).attr("data-price"),
			$(this).attr("data-discount")
		);
	});

	// Generate Swiper.
	generateSwiper();
});
