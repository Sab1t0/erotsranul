// Controllers
var spiderController;
var rudderEnabled = false;

var settingController = new ThemeSettingManager((seasonalMode || "default"), {
	spiders: true,
	snow: true,
	headOverlay: true
})

function updateTheme(event) {
	let theme = getSetTheme()
	let variant = getColorVariant()

	$("html").removeClass();
	$("html").addClass(`theme-${theme}`);
	$("html").attr(`data-color-variant`, variant);
	if (isTouchDevice()) $("html").addClass("device-mobile");

	if (!seasonalMode) {
		if ($("html").hasClass("theme-dark")) $(".theme-selector").html(`<i class="fas fa-moon" aria-hidden="true"></i>`);
		else $(".theme-selector").html(`<i class="far fa-moon" aria-hidden="true"></i>`);
	}

	changeDiscordTheme();

	// Run themed functions
	if (["christmas", "halloween"].includes(seasonalMode)) {
		createDestoryThemeOverlay();
		if (settingController.get("headOverlay") == false) $("html").addClass("disabled-setting-head-overlay");
	}

	// Send to analytics.
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push({
		'theme': theme,
		'color_variant': variant
	});
	
	// Send change event if changed during session.
	if (event) {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'update_theme',
			'theme': theme,
			'color_variant': variant
		});

		if (rudderEnabled) {
			rudderanalytics.track(
				"update_theme", {
					theme: theme,
					color_variant: variant
				},
				() => {}
			);
		}
	}
}

function updateSettings() {
	$("#theme-setting-input[type=\"checkbox\"]").each(function () {
		const settingName = $(this).data("option")
		const settingValue = settingController.get(settingName)

		if(settingValue) $(this).prop("checked", settingValue)
		else $(this).removeProp("checked")
	})
}

updateTheme(false);

// On Document Load.
$(function () {
	// Enable all Tooltips.
	if (!isTouchDevice()) {
		try {
			$('[data-bs-toggle="tooltip"]').tooltip();
		} catch (err) {
			console.error(`Error loading tooltips`)
		}
	} else {
		$("html").addClass("device-mobile");
	}

	// Announcement Close Listener.
	$("#announcement > .fa-times-circle").click(function () {
		const content = $("#announcement > #announcement-text > a").html();
		localStorage.setItem("lc-news-cleared", hashCode(content));

		$("#announcement").slideUp(250, function () {
			recalculateNavigationOverlayHeight();
			recalculateToastPosition();
		});

		// Send GTM event.
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'close_alert',
			'content': content
		});

		if (rudderEnabled) {
			rudderanalytics.track(
				"close_alert", {
					content: content
				},
				() => {}
			);
		}
	})

	// Fetch Online Players & Latest Alert.
	$.get("https://api.lunarclientprod.com/site/metadata", function (data) {
		const onlinePlayers = (data.statistics || {}).onlinePlayers;
		const alert = data.alert;
		if (onlinePlayers) {
			$(".online-count > span").html(`${onlinePlayers.toLocaleString()} online`);
			$(".online-count > i").css("display", "inline-block");
		}
		if (alert) {
			if(hashCode(alert.text) == localStorage.getItem("lc-news-cleared")) return;
			$("#announcement > #announcement-text").html("<a" + (alert.link && " href=" + alert.link) + ">" + alert.text + "</a>")
			$("#announcement").slideDown(250, function () {
				recalculateNavigationOverlayHeight();
				recalculateToastPosition();
			});
		}
	}).fail(function () {
		// Fail Silently.
	})

	// Configure toast.
	$.toastDefaults = {
		position: 'top-right',
		dismissible: false,
		stackable: false,
		pauseDelayOnHover: false,
		style: {
			toast: '',
			info: '',
			success: '',
			warning: '',
			error: '',
		}
	};

	updateTheme(false);
	updateSettings();

	// Theme Icon Listener.
	if (seasonalMode) {
		$(".theme-selector .dropdown-item").click(function () {
			const theme = $(this).data("theme")
			if (["light", "dark"].includes(theme)) {
				localStorage.setItem("lc-theme", $(this).data("theme"));
				localStorage.setItem("lc-disabled-seasonal", seasonalMode);
			} else {
				localStorage.removeItem("lc-disabled-seasonal");
			}

			$.snack("success", `${$(this).data("label")} mode has been enabled!`, 3000);
			updateTheme(true);
		})
	} else {
		$(".theme-selector").click(function () {
			if ($("html").hasClass("theme-dark")) {
				localStorage.setItem("lc-theme", "light");
				$.snack("success", "Light mode has been enabled!", 3000);
			} else {
				localStorage.setItem("lc-theme", "dark");
				$.snack("success", "Dark mode has been enabled!", 3000);
			}
			updateTheme(true);
			recalculateToastPosition();
		});
	}

	// Store Icon Listener.
	$("#nav-icons-holder > .fa-shopping-cart").mousedown(function () {
		window.open('http://store.lunarclient.com/?utm_source=client-site&utm_medium=nav-icon&utm_campaign=lead', "_blank");
	})

	// Website Icon Listener.
	$("#nav-icons-holder > .fa-globe").mousedown(function () {
		window.open('http://www.lunarclient.com/?utm_source=client-store&utm_medium=nav-icon&utm_campaign=lead', "_blank");
	})

	$("#category-selector > select").on('change', function () {
		window.location.href = `/category/${this.value}`
	})

	// Navbar Listener.
	$("#navbar-menu").click(function () {
		scrollToTop();
		if ($(this).hasClass("is-active")) {
			$(this).removeClass("is-active");
			$("#navbar-menu > span").html("menu");
			$("#navbar").removeClass("is-open");
			$("#navbar-overlay").removeClass("enabled");
			$("body").removeClass("nav-open");
		} else {
			$(this).addClass("is-active");
			$("#navbar-menu > span").html("close");
			$("#navbar").addClass("is-open");
			$("#navbar-overlay").addClass("enabled");
			$("body").addClass("nav-open");
		}
	});

	$("#theme-settings-btn").click(function () {
		$('#theme-settings').modal('show');
	});

	$("#theme-setting-input[type=\"checkbox\"]").change(function () { 
		const settingName = $(this).data("option");
		const settingValue = $(this).prop("checked");
		settingController.set(settingName, settingValue)
		updateTheme(false);
	})

	// Show FAQ Entry.
	$(".collapse").on("show.bs.collapse", function () {
		$(this).prev(".card-header")
			.find(".fas")
			.removeClass("fa-chevron-down")
			.addClass("fa-chevron-up");

		// Send GTM Event.
		// TODO: Send more details.
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'open_faq_item',
		});

		if (rudderEnabled) {
			rudderanalytics.track(
				"open_faq_item", {},
				() => {}
			);
		}
	});

	// Hide FAQ Entry.
	$(".collapse").on("hide.bs.collapse", function () {
		$(this).prev(".card-header")
			.find(".fas")
			.removeClass("fa-chevron-up")
			.addClass("fa-chevron-down");
	});

	// Window Resize Listener.
	$(window).on("resize", function () {
		recalculateNavigationOverlayHeight();
		recalculateToastPosition();
		recalculateDropdownVisibility();
	})

	// Recalculate Nav Overlay Height.
	recalculateNavigationOverlayHeight();

	// Recalculate Nav Padding.
	recalculateNavbarPadding();

	// Recalculate Toast Height.
	recalculateToastPosition();

	// Post Section Scroll.
	$(window).on("scroll", function () {
		var scrollPos = $(document).scrollTop();
		$("#section-selector a").each(function () {
			var currLink = $(this);
			var refElement = $("#section-" + currLink.data("section-id"));
			var refElementPos = refElement.position() 
			if (refElementPos && refElementPos.top <= scrollPos && refElementPos.top + refElement.height() > scrollPos) {
				currLink.addClass("selected");
			} else {
				currLink.removeClass("selected");
			}
		})
	})

	// Modal Button
	$('.modal-btn').on('click', function (e) {
		e.preventDefault();
		$('#modal-display > div > .modal-content').load($(this).data('modal-url'), function () {
			$('#modal-display').modal("show");
		})
	});

	// Download page interactivity.
	$("#os-video-selector > h1").on("click", function () {
		const vidId = $(this).data("vid-id");

		$("#os-video-selector > h1").removeClass("vid-selected");
		$(this).addClass("vid-selected");
		$("#install-video").attr("src", "https://www.youtube.com/embed/" + vidId);
	});
	$(".dl-btn").on("click", function () {
		const base = $("#download-versions").data("launcher-url");
		const pathOS = $(this).data("path");
		const path = base + $(this).data("path") + ".yml";
		let version;
		let pathEnd;

		$.get(path, function (data, status) {
			data.split("\n").forEach(function(element) {
				// Path
				if (element.substring(0, 6) == "path: ") {
					pathEnd = element.slice(6).replace("zip", "dmg");
				}
				// Version
				if (element.substring(0, 9) == "version: ") {
					version = element.slice(9);
				}
			});
		}).always(function() {
			if (pathEnd && version) {
				window.location.href = base + pathEnd;
				const vidId = $("#" + pathOS).data("vid-id");

				$("html, body").animate({ scrollTop: $(".install-instructions").offset().top });
				$("#os-video-selector > h1").removeClass("vid-selected");
				$("#" + pathOS).addClass("vid-selected");
				$("#install-video").attr("src", "https://www.youtube.com/embed/" + vidId);

				const installer_variant = pathOS == "latest" ? "windows" : pathOS.replace("latest-", "");

				// Send event to GTM.
				window.dataLayer = window.dataLayer || [];
				window.dataLayer.push({
					'event': 'launcher_download',
					'cdn_base': base,
					'launcher_version': version,
					'installer_variant': installer_variant,
					'file_name': pathEnd
				});

				if (rudderEnabled) {
					rudderanalytics.track(
						"launcher_download", {
							cdn_base: base,
							launcher_version: version,
							installer_variant: installer_variant,
							file_name: pathEnd
						},
						() => {}
					);
				}
			}
		});
	});

	// Store Product Countdown.
	setInterval(function () {
		$(".countdown").each(function () {
			var countdown = $(this);
			timeLeft = parseInt(countdown.attr("data-countdown"));
			if (timeLeft == 0) {
				countdown.html("Time Expired!");
			} else {
				timeLeft--;
				countdown.attr("data-countdown", timeLeft);
				var days = Math.floor(timeLeft / (60 * 60 * 24));
				var hours = Math.floor((timeLeft % (60 * 60 * 24)) / (60 * 60));
				var minutes = Math.floor((timeLeft % (60 * 60)) / (60));
				var seconds = Math.floor((timeLeft % 60));
				countdown.html(days + "d " + hours + "h " + minutes + "m " + seconds + "s");
			}
		})
	}, 1000);

	// Initalise AOS
	AOS.init({
		once: true
	});

	// Automatically open card if id is present in URL.
	$("#questions > .card").each(function () {
		const collapse = $(this).find(".collapse");
		if ($(this).attr("id") == window.location.hash.substring(1)) {
			collapse.collapse();
		}
	});

	// Slide up on alert dismiss.
	$(".dismiss-alert").on("click", function (e) {
		const alert = $(this).parent();
		alert.slideUp(500);
	});

	// Promo Modal Close Button.
	$("#promo-modal .btn-close").click(function() {
		sessionStorage.setItem("promoPopup-closed", "true");
	});

	// Nav CTA Button Click.
	$("#navbar-cta-btn[data-variant!='store']").click(function() {
		const button = $(this);
		const variant = button.data("variant") || "default";
		const text = button.html().replace(/\s+/g, " ").trim() || "Unknown";
		const link = button.attr("href") || "/";

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'nav_cta_click',
			'variant': variant,
			'text': text,
			'link': link
		});

		if (rudderEnabled) {
			rudderanalytics.track(
				"nav_cta_click", {
					variant: variant,
					text: text,
					link: link
				},
				() => {}
			);
		}
	});

	// Footer CTA Button Click.
	$("#footer-cta #cta-button").click(function() {
		// CTA.
		const imageUrl = $("#footer-cta #cta-content > img").attr("src");
		const imageAlt = $("#footer-cta #cta-content > img").attr("alt");
		const ctaContent = $("#footer-cta #cta-content > p").text().replace(/\s+/g, " ").trim();
		const backgroundUrl = $("#footer-cta > #inner-footer-cta").css("background-image").replace('url(','').replace(')','').replace(/\"/gi, "");

		// Button.
		const button = $(this);
		const buttonText = button.text().replace(/\s+/g, " ").trim() || "Unknown";
		// const buttonIcon = "";
		const link = button.attr("href") || "/";

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'footer_cta_click',
			'image_url': imageUrl,
			'image_alt': imageAlt,
			'content': ctaContent,
			'background_url': backgroundUrl,
			'button_text': buttonText,
			// 'button_icon': buttonIcon,
			'link': link
		});

		if (rudderEnabled) {
			rudderanalytics.track(
				"footer_cta_click", {
					image_url: imageUrl,
					image_alt: imageAlt,
					content: ctaContent,
					background_url: backgroundUrl,
					button_text: buttonText,
					link: link
				},
				() => {}
			);
		}
	});

	// Store Video Header Click.
	$("html[data-variant='store'] #header, html[data-variant='store'] #header-video-gradient > a").click(function() {
		const headerTitle = $("#header #header-title").text().replace(/\s+/g, " ").trim();
		const headerSubtitle = $("#header #header-subtitle").text().replace(/\s+/g, " ").trim();
		const headerVideoUrl = $("#header-video > source").attr("src");
		const headerLink = $("#header > a").attr("href") ||  "/";

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'store_header_click',
			'header_title': headerTitle,
			'header_subtitle': headerSubtitle,
			'header_video_url': headerVideoUrl,
			'link': headerLink
		});
	});

	// Currency Change Click.
	$(".currency-selector .dropdown-item").click(function() {
		const currency = $(this).text().replace(/\s+/g, " ").trim();

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'update_store_currency',
			'currency': currency
		});
	});

	// Secondary Nav Item Click.
	$("#navbar-secondary a").click(function() {
		const text = $(this).text().replace(/\s+/g, " ").trim();
		const link = $(this).attr('href');
		const position = $(this).index() + 1;

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'secondary_nav_item_click',
			'text': text,
			'link': link,
			'item_position': position
		});
		
		if (rudderEnabled) {
			rudderanalytics.track(
				"secondary_nav_item_click", {
					text: text,
					link: link,
					item_position: position
				},
				() => {}
			);
		}
	});

	// Store Home Category Click.
	$("#categories .category").click(function() {
		const id = $(this).data("category-id");
		const link = $(this).children("a").attr("href");
		const text = $(this).text().replace(/\s+/g, " ").trim();

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'category_click',
			'variant': 'small',
			'category_id': id,
			'link': link,
			'text': text
		});
	});

	// Store Big Category Click.
	$("#big-categories .category").click(function() {
		const id = $(this).data("variant");
		const link = $(this).children("a").attr("href");
		const text = $(this).text().replace(/\s+/g, " ").trim();

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'category_click',
			'variant': 'big',
			'category_id': id,
			'link': link,
			'text': text
		});
	});

	// Bundles CTA Click.
	$("#home-bundles-cta > a").click(function() {
		const icon = $("#home-bundles-cta .img-holder > img").attr("src");
		const title = $("#home-bundles-cta .content-holder h1").text().replace(/\s+/g, " ").trim();
		const hook = $("#home-bundles-cta .content-holder span").text().replace(/\s+/g, " ").trim();
		const button_text = $("#home-bundles-cta > a").text().replace(/\s+/g, " ").trim();

		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({
			'event': 'bundles_cta_click',
			'bundles_icon': icon,
			'title': title,
			'hook': hook,
			'button_text': button_text
		});
	});

	// Create Comparison Sliders.
	if(typeof Cocoen != "undefined") Cocoen.parse(document.body);
});

function rgbaToHex(color) {
	if (/^rgb/.test(color)) {
	  const rgba = color.replace(/^rgba?\(|\s+|\)$/g, '').split(',');
  
	  // rgb to hex
	  let hex = `#${((1 << 24) + (parseInt(rgba[0], 10) << 16) + (parseInt(rgba[1], 10) << 8) + parseInt(rgba[2], 10))
		.toString(16)
		.slice(1)}`;
  
	  // added alpha param if exists
	  if (rgba[4]) {
		const alpha = Math.round(0o1 * 255);
		const hexAlpha = (alpha + 0x10000).toString(16).substr(-2).toUpperCase();
		hex += hexAlpha;
	  }
  
	  return hex;
	}
	return color;
};

// Checks if the browser belongs to a touch device.
// TODO: Better solution for this.
function isTouchDevice() {
	return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}

// Scroll to the top.
function scrollToTop() {
	document.body.scrollTop = 0; // For Safari
	document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

// Generate hash code.
function hashCode(s) {
	var hash = 0;
	if (s === undefined || s === null || s.length === 0) return hash;
	for (let i = 0; i < s.length; i++) {
		let chr = s.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0;
	}
	return hash;
}

// Setup + Cleanup Spider Container
function createDestoryThemeOverlay() {
	if (seasonalMode == "halloween") {
		const halloween = $("html").hasClass("theme-halloween");
		const spiders = settingController.get("spiders")
		if (!halloween || !spiders) {
			if (spiderController) {
				spiderController.killAll();
				spiderController = null;
			}
			return;
		}
	
		if(spiderController) return;
	
		spiderController = new SpiderController({
			imageSprite: "https://lunarclient.com/assets/img/seasonal/halloween/spider.webp",
			num_frames: 6,
			bugWidth: 118,
			bugHeight: 102,
			canFly: false,
			canDie: true,
			zoom: 5,
			minDelay: 10,
			maxDelay: 100,
			minBugs: Math.round(($(window).width()/400) * 1.5),
			maxBugs: Math.round(($(window).width()/400) * 3.5),
			mouseOver: 'die'
		});
	} else if (seasonalMode == "christmas") {
		const christmas = $("html").hasClass("theme-christmas");
		const snow = settingController.get("snow")
		if (!christmas || !snow) {
			particlesJS("snow", {
				particles: {
					number: { 
						value: 0 
					}
				}
			})
		} else {
			particlesJS("snow", {
				particles: {
					number: {
						value: 400,
						density: { enable: true, value_area: 800 }
					},
					color: {
						value: "#ffffff"
					},
					opacity: {
						value: 0.7,
						random: false,
					},
					size: {
						value: 4,
						random: true
					},
					line_linked: {
						enable: false
					},
					move: {
						enable: true,
						speed: 2.0,
						direction: "bottom",
						random: true,
						straight: false,
						out_mode: "out",
						bounce: false,
						attract: { enable: true, rotateX: 300, rotateY: 1200 }
					}
				}
			})
		}
	}
}

// Check Theme in the user's local storage.
function getSetTheme() {
	if (seasonalMode) {
		const seasonal = localStorage.getItem("lc-disabled-seasonal");
		if (!seasonal || seasonal != seasonalMode) return seasonalMode;
	}
	return localStorage.getItem("lc-theme") || "light";
}

// Readjust Navigation Overlay based on announcement size.
function recalculateNavigationOverlayHeight() {
	let announcementHeight = $("#announcement").outerHeight();
	if ($("#announcement").css("display") == "none") {
		announcementHeight = 0;
	}
	const newHeight = (98 + announcementHeight) + "px";
	$("#navbar-overlay").css("top", newHeight);
	$("#navbar-overlay").css("height", `calc(100vh - ${newHeight})`);
}

// Readjust Navbar padding based on width of button and window width.
function recalculateNavbarPadding() {
	let ctaBtnWidth = $("#navbar-cta-btn").outerWidth();
	let newWidth = 245 + ctaBtnWidth + 30;
	$("#navbar").css("padding-right", `${newWidth}px`);
}

// Readjust toast position based on navbar height, announcement height, and secondary navbar height.
function recalculateToastPosition() {
	let navbarHeight = $("#navbar").outerHeight();
	let secondaryNavbarHeight = $("#navbar-secondary").outerHeight();
	if (!$('#navbar-secondary').length || $("#navbar-secondary").css("display") == "none") {
		secondaryNavbarHeight = 0;
	}
	let announcementHeight = $("#announcement").outerHeight();
	if (!$('#announcement').length || $("#announcement").css("display") == "none") {
		announcementHeight = 0;
	}
	let totalHeight = navbarHeight + secondaryNavbarHeight + announcementHeight;
	$(".toast-container").css("top", `${totalHeight}px`);
	$(".toast-container").css("bottom", "unset");
}

// Readjusts the dropdown visiblity depending on whether the parent button is actually visible.
function recalculateDropdownVisibility() {
	// For store basket.
	if ($(".basket-viewer > .dropdown-menu").hasClass("show")) {
		let ctaBtnWidth = $("#navbar-cta-btn").outerWidth();
		if (ctaBtnWidth <= 0) {
			$(".basket-viewer > .dropdown-menu").trigger("click");
		}
	}
}

// Get the theme's base color variant.
function getColorVariant() {
	const varaints = { halloween: "dark", christmas: "light" }

	let theme = getSetTheme();
	return varaints[theme] || theme;
}

// Attempt to change discord theme.
function changeDiscordTheme() {
	let discordId = $("#LC-Discord").attr("data-discord-id");
	if (!discordId) return;

	let varaint = getColorVariant();

	const url = `https://discordapp.com/widget?id=${discordId}&theme=${varaint}`;
	$("#LC-Discord").attr("src", url);
}

// Show modal ad from Google Optimize.
// TODO: Move this to optimize entirely
function showAdFromExperience(id, url, title, cta, ribbon, background) {
	if (id != undefined) {
		$('#promo-modal').attr('data-experience-id', id);
		// Temp until we inject images and content properly.
		$(`#promo-modal > .modal-dialog > .modal-content > .details-content > div:first-child img:not([data-experience="${id}"])`).css('display', 'none');
	}
	if (url != undefined) {
		$('#promo-modal .modal-content').attr('href', url);
	}
	if (ribbon != undefined) {
		$('#promo-modal .ribbon').css('opacity', 1);
		$('#promo-modal .ribbon').html(ribbon);
	}
	if (title != undefined) {
		$('#promo-modal .promo-title').html(title);
	}
	if (cta != undefined) {
		$("#promo-modal .promo-cta").html(`
			<i class="fas fa-arrow-circle-right"></i>
			${cta}
		`);
	}
	if (background != undefined) {
		$("#promo-modal .modal-content").css('background-image', `url(${background})`);
	}
	$('#promo-modal').modal('show');
}

function useRudderstackFromExperience() {
	rudderanalytics.load("26DdK785WsPsaaHZIFSRFmwPzK7", "https://moonsworthiogj.dataplane.rudderstack.com");
  	rudderanalytics.page();
	rudderEnabled = true;
}