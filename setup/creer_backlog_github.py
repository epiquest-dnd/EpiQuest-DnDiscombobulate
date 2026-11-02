#!/usr/bin/env python3
"""Crée labels, milestones, issues et le tableau GitHub Projects à partir de backlog.json.

Prérequis : GitHub CLI (gh) connecté avec le scope « project » :
    gh auth login
    gh auth refresh -s project

Exemple :
    python3 setup/creer_backlog_github.py --repo mon-orga/mon-depot --dry-run
    (puis relancer sans --dry-run)

Le script est rejouable : labels mis à jour, milestones et issues déjà
existants (même titre) ignorés. Les issues sont créées sans responsable :
chacun s'assigne une issue quand il la prend.
"""
import argparse
import json
import shlex
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def gh(args, dry, input_text=None, capture=True):
    shown = " ".join(shlex.quote(a) for a in args)
    if dry:
        print(f"[dry-run] gh {shown}")
        return ""
    res = subprocess.run(["gh", *args], input=input_text, text=True,
                         capture_output=capture)
    if res.returncode != 0:
        sys.exit(f"Échec : gh {shown}\n{res.stderr}")
    return res.stdout.strip()


def gh_json(args):
    res = subprocess.run(["gh", *args], text=True, capture_output=True)
    if res.returncode != 0:
        sys.exit(f"Échec : gh {' '.join(args)}\n{res.stderr}")
    return json.loads(res.stdout or "null")


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--repo", required=True, help="propriétaire/dépôt")
    p.add_argument("--backlog", default=str(HERE / "backlog.json"))
    p.add_argument("--project-title", default="EpiQuest · Roadmap")
    p.add_argument("--no-project", action="store_true", help="ne pas créer le tableau Projects")
    p.add_argument("--no-bonus", action="store_true", help="ne pas créer les issues bonus")
    p.add_argument("--dry-run", action="store_true", help="afficher les commandes sans rien créer")
    a = p.parse_args()

    data = json.loads(Path(a.backlog).read_text(encoding="utf-8"))
    owner = a.repo.split("/")[0]
    if not a.dry_run:
        gh(["auth", "status"], False)

    # 1. Labels
    print("== Labels")
    for lb in data["labels"]:
        gh(["label", "create", lb["name"], "--repo", a.repo, "--color", lb["color"],
            "--description", lb["description"], "--force"], a.dry_run)

    # 2. Milestones
    print("== Milestones")
    existing_ms = set()
    if not a.dry_run:
        existing_ms = {m["title"] for m in gh_json(
            ["api", f"repos/{a.repo}/milestones?state=all&per_page=100"])}
    ms_title = {}
    for m in data["milestones"]:
        ms_title[m["key"]] = m["title"]
        if m["title"] in existing_ms:
            print(f"  déjà présent : {m['title']}")
            continue
        gh(["api", f"repos/{a.repo}/milestones", "-f", f"title={m['title']}",
            "-f", f"due_on={m['due']}T12:00:00Z", "-f", f"description={m['description']}"],
           a.dry_run)

    # 3. Tableau Projects
    project_number = None
    if not a.no_project:
        print("== GitHub Projects")
        if a.dry_run:
            gh(["project", "create", "--owner", owner, "--title", a.project_title], True)
        else:
            projects = gh_json(["project", "list", "--owner", owner, "--format", "json"])
            found = [pr for pr in projects.get("projects", []) if pr["title"] == a.project_title]
            if found:
                project_number = found[0]["number"]
                print(f"  déjà présent : #{project_number}")
            else:
                created = json.loads(gh(["project", "create", "--owner", owner,
                                         "--title", a.project_title, "--format", "json"], False))
                project_number = created["number"]
            subprocess.run(["gh", "project", "link", str(project_number), "--owner", owner,
                            "--repo", a.repo], capture_output=True)

    # 4. Issues
    print("== Issues")
    existing = set()
    if not a.dry_run:
        existing = {i["title"] for i in gh_json(
            ["issue", "list", "--repo", a.repo, "--state", "all", "--limit", "500",
             "--json", "title"])}
    created = 0
    for it in data["issues"]:
        if a.no_bonus and "bonus" in it["labels"]:
            continue
        if it["title"] in existing:
            print(f"  déjà présente : {it['title']}")
            continue
        args = ["issue", "create", "--repo", a.repo, "--title", it["title"], "--body-file", "-"]
        for lb in it["labels"]:
            args += ["--label", lb]
        if it["milestone"]:
            args += ["--milestone", ms_title[it["milestone"]]]
        url = gh(args, a.dry_run, input_text=it["body"])
        created += 1
        if project_number and url:
            gh(["project", "item-add", str(project_number), "--owner", owner, "--url", url], False)
        if url:
            print(f"  {url}  {it['title']}")
    print(f"\n{created} issue(s) {'à créer' if a.dry_run else 'créée(s)'}.")
    if project_number:
        print("Pensez à ajouter dans le tableau les champs Status (déjà présent), "
              "Iteration ou Milestone, et une vue « Roadmap » groupée par milestone.")


if __name__ == "__main__":
    main()
