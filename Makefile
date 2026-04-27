NETLIFY_SITE_ID ?= 8c01f2bc-20af-43e1-9f2b-d4a547352c79
NETLIFY_SITE_URL ?= https://taste-buddy.app
APP_LOCAL_PATH ?= ../taste_buddy
DART_DEFINE_FILE ?= config/config.env
DEPLOY_MESSAGE ?= Deploy TasteBuddy website and Flutter web app

.PHONY: help install build verify_dist deploy_preview deploy deploy_prod verify_live clean

help:
	@printf "TasteBuddy website deploy targets\n\n"
	@printf "  make build           Build Astro site and Flutter web app into dist/\n"
	@printf "  make verify_dist     Check local dist contains Flutter /app/ files and redirects\n"
	@printf "  make deploy_preview  Upload draft deploy to Netlify\n"
	@printf "  make deploy          Build and publish production to taste-buddy.app\n"
	@printf "  make verify_live     Check live /app/ routes and landing CTA\n"
	@printf "  make clean           Remove build output\n"

install:
	ROLLUP_SKIP_NODEJS=true npm install --legacy-peer-deps

build:
	TASTE_BUDDY_APP_LOCAL_PATH="$(APP_LOCAL_PATH)" \
	TASTE_BUDDY_DART_DEFINE_FILE="$(DART_DEFINE_FILE)" \
	npm run netlify-build

verify_dist:
	@test -f dist/index.html
	@test -f dist/_redirects
	@test -f dist/app/index.html
	@test -f dist/app/flutter_bootstrap.js
	@grep -q '<base href="/app/">' dist/app/index.html
	@grep -q '^/app  /app/  301' dist/_redirects
	@grep -q '^/app/\*  /app/index.html  200' dist/_redirects
	@printf "dist ok: Flutter web app ready under /app/\n"

deploy_preview: build verify_dist
	netlify deploy \
		--site "$(NETLIFY_SITE_ID)" \
		--dir dist \
		--functions .netlify/v1/functions \
		--message "$(DEPLOY_MESSAGE)"

deploy deploy_prod: build verify_dist
	netlify deploy \
		--prod \
		--site "$(NETLIFY_SITE_ID)" \
		--dir dist \
		--functions .netlify/v1/functions \
		--message "$(DEPLOY_MESSAGE)" \
		--timeout 600

verify_live:
	@curl -fsSI -L "$(NETLIFY_SITE_URL)/app/" | head -n 1
	@curl -fsSI -L "$(NETLIFY_SITE_URL)/app/recipes" | head -n 1
	@curl -fsSL "$(NETLIFY_SITE_URL)/" -o /tmp/taste_buddy_home.html
	@grep -q 'Open Web App' /tmp/taste_buddy_home.html
	@curl -fsSL "$(NETLIFY_SITE_URL)/app/" -o /tmp/taste_buddy_app.html
	@grep -q '<base href="/app/">' /tmp/taste_buddy_app.html
	@printf "live ok: %s/app/ responds and landing CTA exists\n" "$(NETLIFY_SITE_URL)"

clean:
	rm -rf dist .netlify/build .netlify/v1
