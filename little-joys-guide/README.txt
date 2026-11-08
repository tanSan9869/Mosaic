LITTLE JOYS — PARENT GUIDANCE COMPANION (PROTOTYPE)
=====================================================

HOW TO RUN
-----------
Unzip the folder and double-click index.html to open it in any browser
(Chrome, Edge, Safari, Firefox). No install or server needed. Data you
enter (child profile, trial pack, subscriptions, feedback) is saved in
your browser's localStorage, so it persists if you close and reopen
the file, but it is local to that browser only.

WHAT'S IMPLEMENTED, AND WHERE IT MAPS TO THE PART 2 SCOPE
-----------------------------------------------------------
1. One-time child profile (age band + dietary constraints)
   -> #/profile  (profile.html screen, saved to localStorage)

2. Suitability guidance per product, in plain parent language
   -> #/product/millet-noodles and #/product/veggie-puffs
   Shows a plain-language verdict (suitable / suitable with a note /
   too young) based on the saved child profile, not ingredient lists.

3. Serving & usage guidance at the point of use, including
   tastemaker/portion guidance for the millet noodles
   -> same product screens, "Serving guidance" and
   "At the point of use" cards.

4. Sampler / trial path (addresses the C3 request)
   -> #/trial  — pick up to 3 items for a trial pack instead of
   committing to a full-size pack.

5. Replenishment prompts + subscription option (addresses the C1
   request)
   -> #/subscribe — set a reorder frequency per product.

6. Feedback loop capturing parent questions and workarounds
   -> #/feedback — submit a question/workaround, and see a running
   (seeded with 3 example entries) list of what other parents have
   asked, which is the input for root-cause analysis on the next
   product/pack decision.

SCOPE OF THIS PROTOTYPE
-------------------------
Per Part 2, this is built around two pilot products only: Millet
Noodles (staple) and Veggie Puffs (snack). Product data, serving
guidance and copy are written to demonstrate the flow and would need
review from Mosaic's nutrition/medical team before any real use with
actual customers. The "QR scan" step is simulated with a product
picker on the home screen — in a real pack, the QR code would deep
link straight into the matching #/product/<id> screen.

FILES
------
index.html   - page structure and templates for every screen
style.css    - visual design
data.js      - product + suitability data and logic
app.js       - router and screen rendering, localStorage persistence
