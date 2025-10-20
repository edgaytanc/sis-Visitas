from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from visits.models import VisitCase, Visit
from .utils import log_action

User = get_user_model()

@receiver(post_save, sender=User)
def audit_user_created(sender, instance: User, created, **kwargs):
    if created:
        log_action(
            user=None,  # el que crea puede ser admin, pero en seed no hay request; lo dejamos vacío
            action="user_created",
            entity="User",
            entity_id=str(instance.id),
            payload={"username": instance.username, "email": instance.email},
        )

@receiver(post_save, sender=VisitCase)
def audit_case_created(sender, instance: VisitCase, created, **kwargs):
    if created:
        log_action(
            user=None,
            action="case_created",
            entity="VisitCase",
            entity_id=str(instance.id),
            payload={"code_persistente": instance.code_persistente, "citizen_id": instance.citizen_id, "topic_id": instance.topic_id},
        )

@receiver(post_save, sender=Visit)
def audit_visit_saved(sender, instance: Visit, created, **kwargs):
    if created:
        # Check-in
        log_action(
            user=instance.intake_user,
            action="visit_checkin",
            entity="Visit",
            entity_id=str(instance.id),
            payload={"badge_code": instance.badge_code, "case_id": instance.case_id},
        )
    else:
        # Si tiene checkout, registramos check-out
        if instance.checkout_at:
            log_action(
                user=None,  # lo registraremos también desde la vista con el usuario e IP (doble capa)
                action="visit_checkout",
                entity="Visit",
                entity_id=str(instance.id),
                payload={"badge_code": instance.badge_code, "case_id": instance.case_id},
            )
