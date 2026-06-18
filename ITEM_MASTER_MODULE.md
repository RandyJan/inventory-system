# Item Master Management Module

## Overview
A complete Item Master Management module has been created for the inventory system. This module enables users to create, read, update, and archive inventory items with comprehensive item information management.

## Features Implemented

### 1. Create Inventory Items
- New item creation form with all required fields
- Automatic validation of item codes and barcodes for uniqueness
- Support for various units of measure
- Pre-defined categories and optional subcategories
- Form validation with custom error messages

### 2. Update Item Details
- Edit existing item information
- Archive/unarchive items
- Bulk field updates with validation
- Protection against duplicate codes/barcodes

### 3. Archive Inactive Items
- Soft delete mechanism via `is_archived` flag
- Active/inactive item filtering
- Archive status clearly visible in UI
- Archival operation with confirmation prompt

### 4. Search and Filter Items
- Search by item code, name, or barcode
- Filter by category
- Toggle between active and archived items
- Paginated results (25 items per page)

## Item Information Fields

✅ **Identification**
- Item Code / SKU (unique, required)
- Barcode / QR Code (unique, optional)
- Item Name (required)
- Description (optional)

✅ **Classification**
- Category (required) - Office Supplies, IT Equipment, Furniture, Maintenance Materials, Medical Supplies, Consumables
- Subcategory (optional)
- Brand (optional)
- Manufacturer (optional)

✅ **Stock Management**
- Unit of Measure (required) - PCS, BOX, PACK, REAM, CASE, BUNDLE, ROLL, KG, LB, L, ML, M, CM
- Reorder Level (required, numeric)
- Minimum Stock Level (required, numeric)
- Maximum Stock Level (required, numeric)

✅ **Pricing**
- Standard Cost (optional, numeric, 2 decimals)
- Selling Price (optional, numeric, 2 decimals)
- Item Image Path (optional, for future implementation)

✅ **Status**
- Is Archived flag (boolean, default false)
- Soft delete support

## Database Schema

### Table: items
```sql
- id (primary key)
- item_code (string, unique)
- barcode (string, unique, nullable)
- name (string)
- description (text, nullable)
- category (string)
- subcategory (string, nullable)
- unit_of_measure (string)
- brand (string, nullable)
- manufacturer (string, nullable)
- reorder_level (decimal 10,2)
- maximum_stock_level (decimal 10,2)
- minimum_stock_level (decimal 10,2)
- standard_cost (decimal 10,2, nullable)
- selling_price (decimal 10,2, nullable)
- image_path (string, nullable)
- is_archived (boolean, default false)
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (timestamp, soft delete)
```

## File Structure

### Backend

**Models:**
- `app/Models/Item.php` - Item model with scopes and casts

**Controllers:**
- `app/Http/Controllers/Item/IndexController.php` - List items with search/filter
- `app/Http/Controllers/Item/CreateController.php` - Show create form
- `app/Http/Controllers/Item/StoreController.php` - Handle item creation
- `app/Http/Controllers/Item/ShowController.php` - Display item details
- `app/Http/Controllers/Item/EditController.php` - Show edit form
- `app/Http/Controllers/Item/UpdateController.php` - Handle item updates
- `app/Http/Controllers/Item/DestroyController.php` - Archive items

**Requests:**
- `app/Http/Requests/Item/StoreItemRequest.php` - Create validation rules
- `app/Http/Requests/Item/UpdateItemRequest.php` - Update validation rules

**Database:**
- `database/migrations/2026_06_18_110044_create_items_table.php` - Items table migration
- `database/factories/ItemFactory.php` - Item model factory for testing
- `database/seeders/ItemSeeder.php` - Database seeder (creates 50 sample items)

### Frontend

**Pages:**
- `resources/js/pages/items/index.tsx` - Items list with search, filter, and pagination
- `resources/js/pages/items/create.tsx` - Create new item form
- `resources/js/pages/items/edit.tsx` - Edit existing item form
- `resources/js/pages/items/show.tsx` - Item details view

### Tests

- `tests/Feature/ListItemsTest.php` - Tests for listing and filtering items
- `tests/Feature/CreateItemTest.php` - Tests for creating items
- `tests/Feature/UpdateItemTest.php` - Tests for updating items
- `tests/Feature/ShowItemTest.php` - Tests for displaying item details

### Routes

**Defined in:** `routes/web.php`

```
GET    /items                  - List all items (items.index)
GET    /items/create           - Show create form (items.create)
POST   /items                  - Store new item (items.store)
GET    /items/{item}           - Show item details (items.show)
GET    /items/{item}/edit      - Show edit form (items.edit)
PUT    /items/{item}           - Update item (items.update)
DELETE /items/{item}           - Archive item (items.destroy)
```

## Features in Detail

### List View
- Paginated table with 25 items per page
- Search functionality across item code, name, and barcode
- Category filter dropdown
- Active/Archived status toggle
- Quick action buttons (View, Edit, Archive)
- Status badge (Active/Archived)
- Displays unit cost and selling price

### Create/Edit Forms
- Clean, organized form layout
- Grouped form sections:
  - Basic Information
  - Classification
  - Stock Levels
  - Pricing
  - Status (edit only)
- Dropdown selects for categories and units of measure
- Numeric inputs with decimal support
- Required field indicators
- Cancel button to return to list

### Item Details View
- Comprehensive item information display
- Organized into card sections
- Edit and Archive action buttons
- Metadata (created/updated dates)
- Status indicator
- Formatted pricing display
- Responsive layout

## Model Methods

**Scopes:**
- `active()` - Get only active items
- `archived()` - Get only archived items
- `search($search)` - Search by code, name, or barcode

**Casts:**
- Decimal fields cast to 2 decimal places
- Timestamps cast to datetime
- Boolean field for is_archived

## Validation Rules

### Create Request
- `item_code`: required, unique, max 50 chars
- `barcode`: nullable, unique, max 100 chars
- `name`: required, max 255 chars
- `description`: nullable, text
- `category`: required, max 100 chars
- `subcategory`: nullable, max 100 chars
- `unit_of_measure`: required, max 50 chars
- `brand`: nullable, max 100 chars
- `manufacturer`: nullable, max 100 chars
- Stock levels: required, numeric, min 0
- Pricing fields: nullable, numeric, min 0

### Update Request
- Same as create request with unique validations excluding current item
- `is_archived`: nullable, boolean

## Sample Categories

Pre-configured categories in controllers:
1. Office Supplies
2. IT Equipment
3. Furniture
4. Maintenance Materials
5. Medical Supplies
6. Consumables

## Testing

Feature tests have been created for:
- Listing items with search and filters
- Creating items with validation
- Updating items
- Archiving items
- Error handling

**Note:** Tests require SQLite driver to be available in the PHP environment.

## Unit of Measure Options

- PCS (Pieces)
- BOX
- PACK
- REAM
- CASE
- BUNDLE
- ROLL
- KG (Kilogram)
- LB (Pound)
- L (Liter)
- ML (Milliliter)
- M (Meter)
- CM (Centimeter)

## Next Steps (Optional Enhancements)

1. **Item Image Upload** - Implement file upload for item images
2. **Bulk Operations** - Add bulk edit/archive functionality
3. **Item History** - Track changes to items with activity logging
4. **Stock Levels** - Integrate with stock tracking system
5. **Barcode Generation** - Auto-generate barcodes
6. **Batch Imports** - CSV/Excel import functionality
7. **Item Variants** - Support for item variants/SKUs
8. **Print Labels** - Generate barcode/QR code labels

## Implementation Notes

- Uses Inertia React v2 for frontend
- Uses Wayfinder for typed route generation
- Follows Laravel best practices with service-based architecture
- Implements soft deletes for data integrity
- Uses Form Requests for validation
- Responsive design with Tailwind CSS v4
- Dark mode support
- Pagination with proper linking
- Role-based access control ready (middleware placeholders)
