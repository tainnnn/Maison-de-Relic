-- Portfolio-only seed: give in-stock showcase items room for repeated demos.
-- Keep intentionally sold-out items at zero and record every adjustment in
-- the inventory ledger. The seed runner applies this file only once per DB.
DO $$
DECLARE item RECORD;
BEGIN
  FOR item IN
    SELECT product_id, stock_quantity
      FROM product
     WHERE status = 'available' AND stock_quantity BETWEEN 1 AND 24
     ORDER BY product_id
     FOR UPDATE
  LOOP
    UPDATE product SET stock_quantity = 25 WHERE product_id = item.product_id;
    INSERT INTO stock_movement
      (product_id, movement_type, qty_change, balance_after, note)
    VALUES
      (item.product_id, 'restock', 25 - item.stock_quantity, 25,
       'Portfolio demo opening stock');
  END LOOP;
END $$;
