from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Date, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profiles = relationship("FamilyProfile", back_populates="user", cascade="all, delete-orphan")
    histories = relationship("History", back_populates="user", cascade="all, delete-orphan")


class FamilyProfile(Base):
    __tablename__ = "family_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    relation = Column(String, nullable=False)  # "Self", "Father", "Mother", "Spouse", "Child", "Grandparent"
    full_name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    weight = Column(Float, nullable=True)  # in kg
    height = Column(Float, nullable=True)  # in cm

    user = relationship("User", back_populates="profiles")
    digital_twin = relationship("DigitalTwin", uselist=False, back_populates="profile", cascade="all, delete-orphan")
    lab_reports = relationship("LabReport", back_populates="profile", cascade="all, delete-orphan")
    inventories = relationship("Inventory", back_populates="profile", cascade="all, delete-orphan")
    wearables = relationship("WearableLog", back_populates="profile", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="profile", cascade="all, delete-orphan")
    allergies = relationship("AllergyProfile", back_populates="profile", cascade="all, delete-orphan")


class DigitalTwin(Base):
    __tablename__ = "digital_twins"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("family_profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    diseases = Column(Text, default="[]")  # JSON string array of conditions
    medical_history = Column(Text, nullable=True)
    sleep_pattern_avg = Column(Float, default=7.0)  # average hours
    activity_score = Column(Float, default=5000.0)  # steps baseline

    profile = relationship("FamilyProfile", back_populates="digital_twin")


class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False)
    test_type = Column(String, nullable=False)  # "CBC", "LFT", "KFT", "Lipid", "Diabetes"
    test_date = Column(Date, nullable=False)
    extracted_data = Column(Text, nullable=False)  # JSON dictionary mapping parameters
    summary = Column(Text, nullable=True)
    abnormalities_found = Column(Text, nullable=True)  # JSON list of flags

    profile = relationship("FamilyProfile", back_populates="lab_reports")


class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False)
    drug_name = Column(String, nullable=False)
    current_stock = Column(Integer, nullable=False, default=30)
    daily_consumption = Column(Integer, nullable=False, default=1)
    last_refill_date = Column(Date, nullable=True)
    refill_lead_days = Column(Integer, default=3)

    profile = relationship("FamilyProfile", back_populates="inventories")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(Integer, ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=True)
    drug_name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)  # e.g. 500mg, 1 tablet
    time_of_day = Column(String, nullable=False)  # e.g. morning, afternoon, night
    days_of_week = Column(String, default="Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday")
    active = Column(Boolean, default=True)
    last_taken = Column(DateTime, nullable=True)

    profile = relationship("FamilyProfile", back_populates="reminders")
    adherence_logs = relationship("AdherenceLog", back_populates="reminder", cascade="all, delete-orphan")


class AdherenceLog(Base):
    __tablename__ = "adherence_logs"

    id = Column(Integer, primary_key=True, index=True)
    reminder_id = Column(Integer, ForeignKey("reminders.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    log_time = Column(Time, nullable=True)
    status = Column(String, nullable=False)  # "Taken", "Missed", "Delayed"

    reminder = relationship("Reminder", back_populates="adherence_logs")


class WearableLog(Base):
    __tablename__ = "wearable_logs"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    steps = Column(Integer, default=0)
    avg_heart_rate = Column(Float, default=0.0)
    sleep_hours = Column(Float, default=0.0)

    profile = relationship("FamilyProfile", back_populates="wearables")


class History(Base):
    __tablename__ = "histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)  # e.g. scan, interaction_check, chat, ocr_discharge
    details_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="histories")


class AllergyProfile(Base):
    __tablename__ = "allergy_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(Integer, ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=True)
    allergen_name = Column(String, nullable=False, index=True) # e.g. Penicillin, Aspirin, Sulfa drugs
    severity = Column(String, default="Medium") # Low, Medium, High

    user = relationship("User")
    profile = relationship("FamilyProfile", back_populates="allergies")
