# StockMaster User Manual

## 1. System Overview

StockMaster is an inventory management system for controlling item records, warehouse storage, purchasing, stock movement, approvals, reporting, and audit history. The system is organized around a simple operational flow:

1. Set up master data: items, categories, suppliers, warehouses, and storage locations.
2. Request and approve purchasing: create purchase requisitions, convert approved requests to purchase orders, and approve purchase orders.
3. Move inventory: receive purchased stock, issue stock to departments, transfer stock between warehouses, adjust inventory, and perform stock counts.
4. Monitor and review: use the dashboard, reports, notifications, and audit logs to track activity and inventory health.
5. Control access: manage users, roles, permissions, and approval workflows.

Access to modules depends on the permissions assigned to your role. If a menu item is not visible, your account may not have permission to use it.

## 2. Getting Started

### Logging In

1. Open the StockMaster login page.
2. Enter your username or email and password.
3. Complete two-factor authentication if it is enabled for your account.
4. After login, you will be redirected to the dashboard.

### Navigating the System

Use the sidebar to move between modules. Sidebar links may preload pages for faster navigation. When you click a module, a loading indicator appears while the page opens.

### Common Page Controls

Most modules include:

- Search: find records by number, name, code, supplier, department, or related text.
- Filters: narrow records by status, type, supplier, variance, or department.
- Summary cards: show totals and quick operational counts.
- Create or record buttons: open forms for new transactions or master data.
- Row actions: submit, approve, reject, edit, view, assign, export, or update records depending on the module.

## 3. Module Groups and Relationships

### Overview

The Dashboard summarizes the current state of the inventory system. It depends on data from items, suppliers, warehouses, receiving, issuance, transfer, adjustment, and purchasing modules.

### Inventory Setup

Inventory Setup contains the master records used by almost every other module:

- Items define what can be bought, stored, issued, transferred, counted, and reported.
- Inventory Categories group items for organization and reporting.
- Warehouse Locations define where stock can be stored and who can manage storage areas.

### Purchasing

Purchasing controls the process before inventory enters stock:

- Suppliers identify where items are purchased from.
- Purchase Requisitions document internal requests for items.
- Purchase Orders formalize approved purchases from suppliers.
- Stock Receiving uses supplier and item information to increase inventory once purchased goods arrive.

### Stock Operations

Stock Operations record the physical and accounting movement of inventory:

- Stock Receiving increases item quantity on hand.
- Stock Issuance decreases item quantity on hand when stock is released to departments or requestors.
- Stock Transfers move stock between warehouses or locations and may require approval.
- Inventory Adjustments correct stock quantities for loss, damage, found stock, corrections, or other reasons.
- Stock Counts compare system quantities against actual counted quantities and highlight variances.

### Reports and Audit

Reports and Audit help review system data:

- Reports present operational data and support CSV export.
- Audit Logs show tracked system activity for traceability and accountability.

### Administration

Administration controls system access and approval behavior:

- User Management controls user status and role assignment.
- Role Management groups permissions into job-based roles.
- Permission Management defines the actions users may perform.
- Approval Workflows define approval steps for supported workflows, currently including stock transfers.

## 4. Module Reference

### Dashboard

Purpose: Provides a high-level view of inventory health and operational activity.

Use it to review:

- Total, active, archived, assigned, and unassigned items.
- Low-stock and out-of-stock items.
- Current inventory value.
- Warehouse and location capacity usage.
- Supplier performance.
- Recent items and recent transactions.
- Alerts such as unassigned items, high warehouse capacity usage, and suppliers on hold.

Relationship to other modules: The dashboard reads from setup, purchasing, and stock operation records. It is a monitoring module, not a transaction entry module.

### Items

Purpose: Maintains the item master list.

Use it to:

- Create item records.
- View item details.
- Edit item information.
- Archive or delete items where permitted.
- Track item code, name, category, storage assignment, unit, cost, reorder level, and quantity on hand.

Relationship to other modules: Items are required for purchase requisitions, purchase orders, stock receiving, stock issuance, stock transfers, inventory adjustments, stock counts, reports, and dashboard analytics.

### Inventory Categories

Purpose: Organizes items into meaningful groups.

Use it to:

- Create and update categories.
- Group related items.
- Improve filtering, reporting, and dashboard category mix.

Relationship to other modules: Categories support the item master and reporting. They do not directly move stock.

### Warehouse Locations

Purpose: Manages warehouses, storage locations, item placement, and warehouse permissions.

Use it to:

- Create and update warehouses.
- Create and update locations inside warehouses.
- Assign items to locations.
- Set warehouse-level user permissions.
- Track storage type, capacity, used capacity, and active status.

Relationship to other modules: Warehouse and location data are used by items, stock transfers, dashboard capacity analytics, and reports. Good warehouse setup makes stock movement and storage tracking cleaner.

### Supplier Management

Purpose: Maintains supplier records used for purchasing and receiving.

Use it to:

- Create suppliers.
- Update supplier details.
- Track status and performance information.
- Filter purchase and receiving activity by supplier.

Relationship to other modules: Suppliers are used by purchase orders and stock receiving. Supplier performance appears on the dashboard and can influence purchasing decisions.

### Purchase Requisitions

Purpose: Records internal requests to buy items.

Use it to:

- Create a requisition with requesting department, purpose, needed date, and item lines.
- Save the requisition as a draft or working record.
- Submit it for supervisor approval.
- Approve or reject submitted requests.
- Convert approved requisitions toward purchase order processing.

Typical status flow:

1. Create requisition.
2. Submit for approval.
3. Supervisor approves or rejects.
4. Approved requisition can be converted for purchasing.

Relationship to other modules: Requisitions use item master data and can feed purchase orders. They create a request trail before money is committed to a supplier.

### Purchase Orders

Purpose: Formalizes a purchase from a supplier.

Use it to:

- Create a purchase order from item and supplier details.
- Link a purchase order to a purchase requisition when applicable.
- Submit the order for approval.
- Approve or reject the order.
- Track order date, expected delivery date, total amount, supplier, and line items.

Typical status flow:

1. Create purchase order.
2. Submit for approval.
3. Approver approves or rejects.
4. Approved orders can be used as a reference during stock receiving.

Relationship to other modules: Purchase orders depend on suppliers and items. They often originate from purchase requisitions and lead into stock receiving.

### Stock Receiving

Purpose: Records incoming inventory and increases quantity on hand.

Use it to:

- Record goods received from a supplier.
- Reference a purchase order when available.
- Enter delivery date, supplier, receiving lines, quantities, units, and remarks.
- Confirm receipt so inventory quantities are updated.

Relationship to other modules: Receiving depends on suppliers and items. It increases item stock and appears in dashboard recent transactions and reports.

### Stock Issuance

Purpose: Records outgoing inventory issued to departments or requestors and decreases quantity on hand.

Use it to:

- Record the requesting department and requestor.
- Select issued items and quantities.
- Save the issuance so inventory quantities are updated.

Relationship to other modules: Issuance depends on item quantities. It is the main record of stock leaving inventory for internal use and feeds consumption analytics.

### Stock Transfers

Purpose: Moves stock from one warehouse to another and supports approval.

Use it to:

- Request a transfer from a source warehouse to a destination warehouse or location.
- Add item lines and quantities.
- Submit the transfer request.
- Approve or reject the transfer when authorized.
- Review approval steps, current approval step, requester, approver, and approval remarks.

Typical status flow:

1. Request transfer.
2. System creates approval steps from the configured workflow.
3. Authorized approvers approve or reject.
4. Approved transfer updates destination warehouse stock information.

Relationship to other modules: Transfers depend on items, warehouses, warehouse locations, and approval workflows. They help control internal movement without treating it as a purchase or consumption.

### Inventory Adjustments

Purpose: Corrects inventory quantities when system stock and actual stock need manual alignment.

Use it to:

- Record adjustment type and reason.
- Select items and adjusted quantities.
- Capture quantity before, quantity after, remarks, and responsible user.
- Save the adjustment so stock quantity is updated.

Common reasons include corrections, loss, damage, found stock, or other operational discrepancies.

Relationship to other modules: Adjustments affect item quantity on hand directly. They should be used carefully because they change inventory without a purchasing or issuance transaction.

### Stock Counts

Purpose: Records physical inventory counts and identifies variance.

Use it to:

- Create a stock count.
- Enter actual quantities counted for items.
- Compare actual quantity against system quantity.
- Review variance quantity and recommendations.
- Generate a variance record for follow-up.

Relationship to other modules: Stock counts do not replace receiving, issuance, or adjustment records. They identify differences. If a variance must change stock, use inventory adjustment according to company policy.

### Reports

Purpose: Provides structured views of system data.

Use it to:

- Open available reports from the report catalog.
- Review report details.
- Export report data to CSV when needed.

Relationship to other modules: Reports read from master data, purchasing, stock operations, and audit data. They support review and decision-making.

### Audit Logs

Purpose: Provides traceability for system activity.

Use it to:

- Search and filter activity logs.
- View detailed audit records.
- Investigate who performed important actions and when.

Relationship to other modules: Audit logs support accountability across the system. They should be used when reviewing sensitive updates, approvals, role changes, and transaction history.

### Notifications

Purpose: Displays system notifications and real-time updates.

Use it to:

- Review notification history.
- Mark individual notifications as read.
- Mark all notifications as read.
- Receive role-change and workflow-related messages when configured.

Relationship to other modules: Notifications support communication around user changes, approval activity, and other system events.

### User Management

Purpose: Manages user access status and role assignment.

Use it to:

- Search and filter users.
- Assign or change user roles.
- Activate users.
- Deactivate users.

Relationship to other modules: User roles and active status determine which modules and actions a user can access. User changes may generate notifications.

### Role Management

Purpose: Groups permissions into operational roles.

Use it to:

- Create roles.
- Update role names and assigned permissions.
- Delete roles when allowed.

Relationship to other modules: Roles control access across all modules. A role usually represents a job function, such as inventory staff, purchasing officer, supervisor, approver, or administrator.

### Permission Management

Purpose: Maintains individual permissions used by roles.

Use it to:

- Create permissions.
- Update permission labels or grouping.
- Delete permissions when safe.

Relationship to other modules: Permissions are the smallest unit of access control. Sidebar visibility and actions such as create, update, approve, reject, and delete depend on permissions.

### Approval Workflows

Purpose: Configures approval steps for supported processes.

Use it to:

- Create approval workflows.
- Add ordered approval steps.
- Assign each step to a role or permission.
- Activate or update workflows.

Relationship to other modules: Approval workflows currently support stock transfer approvals. A stock transfer uses the active workflow to determine who must approve before the transfer can be completed.

### Settings

Purpose: Allows users to manage personal account preferences.

Use it to:

- Update profile information.
- Change password.
- Configure two-factor authentication.
- Change appearance preferences.

Relationship to other modules: Settings affect the logged-in user's own account and interface experience.

## 5. Common Workflows

### A. Initial Inventory Setup

1. Create inventory categories.
2. Create warehouses.
3. Create warehouse locations.
4. Create items and assign categories, costs, reorder levels, and storage locations.
5. Create suppliers.
6. Assign warehouse permissions where required.

Result: The system is ready for purchasing and stock operations.

### B. Purchasing to Receiving

1. A requester creates a purchase requisition.
2. The requisition is submitted for approval.
3. A supervisor approves or rejects the requisition.
4. Approved requisitions are converted or referenced for purchasing.
5. Purchasing creates a purchase order for a supplier.
6. The purchase order is submitted and approved.
7. When goods arrive, stock receiving records the delivery.
8. The system increases item quantity on hand.

Result: Purchased goods become available inventory.

### C. Issuing Stock to a Department

1. Inventory staff opens Stock Issuance.
2. The staff selects the requesting department and requestor.
3. The staff selects items and quantities to issue.
4. The system records the issuance and decreases item quantity on hand.

Result: Inventory reflects stock released for internal use.

### D. Transferring Stock Between Warehouses

1. A user creates a stock transfer request.
2. The request identifies source warehouse, destination warehouse or location, items, and quantities.
3. The transfer follows the configured approval workflow.
4. Authorized approvers approve or reject the transfer.
5. Approved transfers update destination warehouse stock information.

Result: Stock movement is controlled and traceable.

### E. Correcting Inventory Quantity

1. Perform a stock count or identify a discrepancy.
2. Review the system quantity versus actual quantity.
3. If correction is required, create an inventory adjustment.
4. Enter adjustment type, reason, item lines, and remarks.
5. Save the adjustment.

Result: Quantity on hand is corrected with an auditable reason.

### F. Reviewing Activity

1. Open the Dashboard for high-level monitoring.
2. Open Reports for detailed operational data.
3. Export reports to CSV when needed.
4. Open Audit Logs to review sensitive or historical activity.

Result: Management and operations teams can review status, performance, and traceability.

## 6. Recommended Operating Practices

- Keep item records complete before transactions begin.
- Use categories and warehouse locations consistently.
- Use purchase requisitions before purchase orders when approval or request traceability is needed.
- Use stock receiving for incoming stock, not adjustments.
- Use stock issuance for outgoing stock, not adjustments.
- Use stock transfers for internal movement between warehouses or locations.
- Use inventory adjustments only for corrections and documented discrepancies.
- Run stock counts regularly to validate inventory accuracy.
- Review dashboard alerts and low-stock indicators frequently.
- Keep roles and permissions aligned with actual job responsibilities.
- Use audit logs when investigating unexpected changes.

## 7. Permission Notes

The system uses permission-based access. Common permission patterns include:

- `*.view`: view a module.
- `*.create`: create records.
- `*.update`: update records.
- `*.delete`: delete records.
- `*.submit`: submit records for approval.
- `*.approve`: approve or reject records.
- `*.manage`: manage configuration such as approval workflows.

Exact access depends on the role assigned to the user. Contact a system administrator if a required module or action is missing.

## 8. Glossary

- Item: A stock or inventory object managed by the system.
- Quantity on hand: Current system quantity available for an item.
- Warehouse: A storage facility or major stock-holding area.
- Location: A specific storage position inside a warehouse.
- Supplier: A vendor that provides goods.
- Purchase Requisition: An internal request to buy items.
- Purchase Order: A formal purchasing document sent to or associated with a supplier.
- Stock Receiving: A transaction that records incoming stock.
- Stock Issuance: A transaction that records outgoing stock.
- Stock Transfer: A controlled movement of stock between warehouses or locations.
- Inventory Adjustment: A manual correction to stock quantity.
- Stock Count: A physical count used to compare actual quantity against system quantity.
- Approval Workflow: Ordered steps that determine who must approve a transaction.
- Audit Log: A historical record of important system actions.
