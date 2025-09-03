from sqlalchemy.orm import Session
from ..models import AuditEvent
from typing import Optional, Dict
import json


def log_audit(db: Session, *, actor_user_id: Optional[str], action: str, entity: str,
			   entity_id: Optional[str] = None, metadata: Optional[Dict] = None,
			   source_ip: Optional[str] = None, user_agent: Optional[str] = None) -> None:
	event = AuditEvent(
		actor_user_id=actor_user_id,
		action=action,
		entity=entity,
		entity_id=entity_id,
		metadata_json=json.dumps(metadata or {}),  # Convert dict to JSON string
		source_ip=source_ip,
		user_agent=user_agent,
	)
	db.add(event)
	db.commit() 