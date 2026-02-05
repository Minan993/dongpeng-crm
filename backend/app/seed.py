from sqlalchemy.orm import Session

from .models import User, Role, RoleCode, UserRole, Permission, RolePermission
from .security import hash_password


ROLE_MAP = {
    RoleCode.super_admin.value: "超级管理员",
    RoleCode.manager.value: "店长",
    RoleCode.sales.value: "销售",
    RoleCode.designer.value: "设计师",
    RoleCode.document.value: "单证",
    RoleCode.warehouse.value: "仓库",
    RoleCode.service.value: "售后",
}

BASE_PERMS = {
    "dashboard.view": "查看看板",
    "user.view": "查看用户",
    "user.create": "创建用户",
    "lead.view": "查看线索",
    "lead.create": "新建线索",
    "lead.stage": "推进线索阶段",
    "customer.view": "查看客户",
    "customer.create": "新建客户",
    "customer.merge": "合并客户",
    "measure.view": "查看量尺",
    "measure.create": "创建量尺",
    "quote.view": "查看报价",
    "quote.create": "创建报价",
    "order.view": "查看订单",
    "order.create": "创建订单",
    "ticket.view": "查看售后工单",
    "ticket.create": "创建售后工单",
    "visit.view": "查看回访",
    "visit.create": "创建回访",
}


def seed_init(db: Session) -> None:
    role_objs = {}
    for code, name in ROLE_MAP.items():
        obj = db.query(Role).filter(Role.code == code).first()
        if not obj:
            obj = Role(code=code, name=name)
            db.add(obj)
            db.flush()
        role_objs[code] = obj

    perm_objs = {}
    for code, name in BASE_PERMS.items():
        obj = db.query(Permission).filter(Permission.code == code).first()
        if not obj:
            obj = Permission(code=code, name=name)
            db.add(obj)
            db.flush()
        perm_objs[code] = obj

    super_admin_role = role_objs[RoleCode.super_admin.value]
    for p in perm_objs.values():
        exists = db.query(RolePermission).filter(RolePermission.role_id == super_admin_role.id, RolePermission.permission_id == p.id).first()
        if not exists:
            db.add(RolePermission(role_id=super_admin_role.id, permission_id=p.id))

    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            password_hash=hash_password("Admin@12345"),
            real_name="系统管理员",
            mobile="13800000000",
            force_change_password=True,
        )
        db.add(admin)
        db.flush()

    ur_exists = db.query(UserRole).filter(UserRole.user_id == admin.id, UserRole.role_id == super_admin_role.id).first()
    if not ur_exists:
        db.add(UserRole(user_id=admin.id, role_id=super_admin_role.id))

    db.commit()
